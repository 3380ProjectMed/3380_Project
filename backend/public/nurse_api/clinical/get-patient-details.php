<?php
header('Content-Type: application/json');
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {
    //session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $conn = getDBConnection();
    $email = $_SESSION['email'] ?? '';

    // Get nurse_id from session
    $nurseRows = executeQuery(
        $conn,
        "SELECT n.nurse_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1",
        's',
        [$email]
    );

    if (empty($nurseRows)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Nurse not found']);
        closeDBConnection($conn);
        exit;
    }

    $nurseId = (int)$nurseRows[0]['nurse_id'];

    // Handle IDs - strip "A" prefix from appointment IDs if present
    $visit_id = isset($_GET['visit_id']) ? intval($_GET['visit_id']) : 0;
    $appointment_id_raw = isset($_GET['appointment_id']) ? trim($_GET['appointment_id']) : '';
    $appointment_id = 0;
    
    if (!empty($appointment_id_raw)) {
        $cleaned_id = $appointment_id_raw;
        if (strtoupper(substr($cleaned_id, 0, 1)) === 'A') {
            $cleaned_id = substr($cleaned_id, 1);
        }
        $appointment_id = intval($cleaned_id);
    }

    if ($visit_id === 0 && $appointment_id === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'visit_id or appointment_id required']);
        exit;
    }

    $rows = [];

    if ($appointment_id > 0) {
        // Get appointment details first
        $apptSql = "SELECT 
                    a.Appointment_id,
                    a.Patient_id,
                    a.Appointment_date,
                    a.Doctor_id,
                    a.Reason_for_visit,
                    a.Office_id,
                    CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                    p.dob,
                    p.blood_type,
                    ca.allergies_text as allergies,
                    cg.gender_text as gender,
                    CONCAT(ds.first_name, ' ', ds.last_name) as doctor_name,
                    o.name as office_name
                FROM appointment a
                LEFT JOIN patient p ON a.Patient_id = p.patient_id
                LEFT JOIN codes_allergies ca ON p.allergies = ca.allergies_code
                LEFT JOIN codes_gender cg ON p.gender = cg.gender_code
                LEFT JOIN staff ds ON a.Doctor_id = ds.staff_id
                LEFT JOIN office o ON a.Office_id = o.office_id
                WHERE a.Appointment_id = ?";
        
        $apptRows = executeQuery($conn, $apptSql, 'i', [$appointment_id]);

        if (empty($apptRows)) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Appointment not found',
                'has_visit' => false
            ]);
            closeDBConnection($conn);
            exit;
        }

        $appt = $apptRows[0];
        $apptDate = date('Y-m-d', strtotime($appt['Appointment_date']));

        // Look for existing patient_visit for this appointment
        $visitSql = "SELECT 
                    pv.visit_id,
                    pv.appointment_id,
                    pv.patient_id,
                    pv.office_id,
                    pv.date,
                    pv.blood_pressure,
                    pv.temperature,
                    pv.doctor_id,
                    pv.nurse_id,
                    pv.status,
                    pv.diagnosis,
                    pv.reason_for_visit,
                    pv.department,
                    pv.present_illnesses,
                    pv.start_at,
                    pv.end_at,
                    pv.created_at,
                    pv.created_by,
                    pv.last_updated,
                    pv.updated_by
                FROM patient_visit pv
                WHERE pv.appointment_id = ?";

        $visitRows = executeQuery($conn, $visitSql, 'i', [$appointment_id]);

        // Merge appointment and visit data
        $visitData = null;
        if (!empty($visitRows)) {
            $visitData = $visitRows[0];
        } else {
            // Create placeholder visit data from appointment
            $visitData = [
                'visit_id' => null,
                'appointment_id' => $appointment_id,
                'patient_id' => $appt['Patient_id'],
                'office_id' => $appt['Office_id'],
                'date' => $appt['Appointment_date'],
                'blood_pressure' => null,
                'temperature' => null,
                'doctor_id' => $appt['Doctor_id'],
                'nurse_id' => $nurseId, // Assign current nurse
                'status' => 'Scheduled',
                'diagnosis' => null,
                'reason_for_visit' => $appt['Reason_for_visit'],
                'department' => null,
                'present_illnesses' => null,
                'start_at' => null,
                'end_at' => null,
                'created_at' => null,
                'created_by' => null,
                'last_updated' => null,
                'updated_by' => null
            ];
        }

        $result = [
            'success' => true,
            'has_visit' => !empty($visitRows),
            'patient' => [
                'patient_id' => $appt['Patient_id'],
                'name' => $appt['patient_name'],
                'dob' => $appt['dob'],
                'age' => $appt['dob'] ? floor((time() - strtotime($appt['dob'])) / 31556926) : null,
                'gender' => $appt['gender'] ?? 'Unknown',
                'blood_type' => $appt['blood_type'],
                'allergies' => $appt['allergies'] ?? 'None'
            ],
            'visit' => $visitData,
            'appointment' => [
                'appointment_id' => $appt['Appointment_id'],
                'date' => $appt['Appointment_date'],
                'reason' => $appt['Reason_for_visit'],
                'doctor_name' => $appt['doctor_name'],
                'office_name' => $appt['office_name']
            ]
        ];

    } else {
        // Look up by visit_id
        $visitSql = "SELECT 
                    pv.visit_id,
                    pv.appointment_id,
                    pv.patient_id,
                    pv.office_id,
                    pv.date,
                    pv.blood_pressure,
                    pv.temperature,
                    pv.doctor_id,
                    pv.nurse_id,
                    pv.status,
                    pv.diagnosis,
                    pv.reason_for_visit,
                    pv.department,
                    pv.present_illnesses,
                    pv.start_at,
                    pv.end_at,
                    pv.created_at,
                    pv.created_by,
                    pv.last_updated,
                    pv.updated_by,
                    CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                    p.dob,
                    p.blood_type,
                    ca.allergies_text as allergies,
                    cg.gender_text as gender,
                    CONCAT(ds.first_name, ' ', ds.last_name) as doctor_name,
                    o.name as office_name
                FROM patient_visit pv
                LEFT JOIN patient p ON pv.patient_id = p.patient_id
                LEFT JOIN codes_allergies ca ON p.allergies = ca.allergies_code
                LEFT JOIN codes_gender cg ON p.gender = cg.gender_code
                LEFT JOIN staff ds ON pv.doctor_id = ds.staff_id
                LEFT JOIN office o ON pv.office_id = o.office_id
                WHERE pv.visit_id = ? AND pv.nurse_id = ?";

        $visitRows = executeQuery($conn, $visitSql, 'ii', [$visit_id, $nurseId]);

        if (empty($visitRows)) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Visit not found or not assigned to this nurse']);
            closeDBConnection($conn);
            exit;
        }

        $visit = $visitRows[0];

        $result = [
            'success' => true,
            'has_visit' => true,
            'patient' => [
                'patient_id' => $visit['patient_id'],
                'name' => $visit['patient_name'],
                'dob' => $visit['dob'],
                'age' => $visit['dob'] ? floor((time() - strtotime($visit['dob'])) / 31556926) : null,
                'gender' => $visit['gender'] ?? 'Unknown',
                'blood_type' => $visit['blood_type'],
                'allergies' => $visit['allergies'] ?? 'None'
            ],
            'visit' => $visit,
            'appointment' => [
                'appointment_id' => $visit['appointment_id'],
                'date' => $visit['date'],
                'reason' => $visit['reason_for_visit'],
                'doctor_name' => $visit['doctor_name'],
                'office_name' => $visit['office_name']
            ]
        ];
    }

    closeDBConnection($conn);
    echo json_encode($result);

} catch (Exception $e) {
    if (isset($conn)) closeDBConnection($conn);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>