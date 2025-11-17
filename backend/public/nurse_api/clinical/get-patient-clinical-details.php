<?php
header('Content-Type: application/json');
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {
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

    // Get patient_id and optional appointment_id from parameters
    $patient_id = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;
    $appointment_id_raw = isset($_GET['appointment_id']) ? trim($_GET['appointment_id']) : '';
    $appointment_id = 0;
    
    if (!empty($appointment_id_raw)) {
        $cleaned_id = $appointment_id_raw;
        if (strtoupper(substr($cleaned_id, 0, 1)) === 'A') {
            $cleaned_id = substr($cleaned_id, 1);
        }
        $appointment_id = intval($cleaned_id);
    }

    // If we have appointment_id, get patient_id from it
    if ($appointment_id > 0 && $patient_id === 0) {
        $apptRows = executeQuery(
            $conn,
            "SELECT Patient_id FROM appointment WHERE Appointment_id = ?",
            'i',
            [$appointment_id]
        );
        if (!empty($apptRows)) {
            $patient_id = intval($apptRows[0]['Patient_id']);
        }
    }

    if ($patient_id === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'patient_id required']);
        closeDBConnection($conn);
        exit;
    }

    // Get basic patient information
    $patientSql = "SELECT 
                    p.patient_id,
                    p.first_name,
                    p.last_name,
                    p.dob,
                    p.blood_type,
                    cg.gender_text as gender
                FROM patient p
                LEFT JOIN codes_gender cg ON p.gender = cg.gender_code
                WHERE p.patient_id = ?";

    $patientRows = executeQuery($conn, $patientSql, 'i', [$patient_id]);

    if (empty($patientRows)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Patient not found']);
        closeDBConnection($conn);
        exit;
    }

    $patient = $patientRows[0];
    $patientName = $patient['first_name'] . ' ' . $patient['last_name'];
    $age = $patient['dob'] ? floor((time() - strtotime($patient['dob'])) / 31556926) : null;

    // Get visit and vitals data (latest for this patient if appointment_id provided)
    $vitals = [
        'bp' => '',
        'hr' => '',
        'temp' => '',
        'spo2' => '',
        'height' => '',
        'weight' => ''
    ];
    $visitId = null;

    if ($appointment_id > 0) {
        // Try to get visit data for specific appointment
        $visitSql = "SELECT 
                        pv.visit_id,
                        pv.blood_pressure,
                        pv.temperature,
                        pv.present_illnesses
                    FROM patient_visit pv
                    WHERE pv.appointment_id = ? AND pv.patient_id = ?
                    LIMIT 1";
        
        $visitRows = executeQuery($conn, $visitSql, 'ii', [$appointment_id, $patient_id]);
        
        if (!empty($visitRows)) {
            $visit = $visitRows[0];
            $visitId = $visit['visit_id'];
            $vitals['bp'] = $visit['blood_pressure'] ?? '';
            $vitals['temp'] = $visit['temperature'] ?? '';
        }
    } else {
        // Get most recent visit for this patient
        $visitSql = "SELECT 
                        pv.visit_id,
                        pv.blood_pressure,
                        pv.temperature,
                        pv.present_illnesses
                    FROM patient_visit pv
                    WHERE pv.patient_id = ?
                    ORDER BY pv.created_at DESC
                    LIMIT 1";
        
        $visitRows = executeQuery($conn, $visitSql, 'i', [$patient_id]);
        
        if (!empty($visitRows)) {
            $visit = $visitRows[0];
            $visitId = $visit['visit_id'];
            $vitals['bp'] = $visit['blood_pressure'] ?? '';
            $vitals['temp'] = $visit['temperature'] ?? '';
        }
    }

    // Get patient allergies from allergies_per_patient table
    $allergies = [];
    $allergySql = "SELECT 
                    app.app_id,
                    app.allergy_id,
                    ca.allergies_text as name,
                    app.notes
                FROM allergies_per_patient app
                JOIN codes_allergies ca ON app.allergy_id = ca.allergies_code
                WHERE app.patient_id = ?
                ORDER BY ca.allergies_text";
    
    $allergyRows = executeQuery($conn, $allergySql, 'i', [$patient_id]);
    
    foreach ($allergyRows as $row) {
        $allergies[] = [
            'appId' => intval($row['app_id']),
            'allergyId' => intval($row['allergy_id']),
            'name' => $row['name'],
            'notes' => $row['notes'] ?? ''
        ];
    }

    // Get patient medications from medication_history table
    $medications = [];
    $medicationSql = "SELECT 
                        mh.drug_id,
                        mh.drug_name,
                        mh.duration_and_frequency_of_drug_use
                    FROM medication_history mh
                    WHERE mh.patient_id = ?
                    ORDER BY mh.drug_id DESC";
    
    $medicationRows = executeQuery($conn, $medicationSql, 'i', [$patient_id]);
    
    foreach ($medicationRows as $row) {
        $medications[] = [
            'id' => intval($row['drug_id']),
            'name' => $row['drug_name'],
            'dosageAndFrequency' => $row['duration_and_frequency_of_drug_use'] ?? ''
        ];
    }

    $result = [
        'success' => true,
        'patientId' => $patient_id,
        'appointmentId' => $appointment_id > 0 ? $appointment_id : null,
        'visitId' => $visitId,
        'patient' => [
            'patient_id' => $patient_id,
            'name' => $patientName,
            'first_name' => $patient['first_name'],
            'last_name' => $patient['last_name'],
            'dob' => $patient['dob'],
            'age' => $age,
            'gender' => $patient['gender'] ?? 'Unknown',
            'blood_type' => $patient['blood_type']
        ],
        'vitals' => $vitals,
        'allergies' => $allergies,
        'medications' => $medications
    ];

    closeDBConnection($conn);
    echo json_encode($result);

} catch (Exception $e) {
    if (isset($conn)) closeDBConnection($conn);
    error_log('[get-patient-clinical-details] Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to load patient details']);
}
?>