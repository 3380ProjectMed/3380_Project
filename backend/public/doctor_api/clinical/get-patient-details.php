<?php

/**
 * Get patient visit details - DATE-SPECIFIC VERSION
 * Now includes treatments from treatment_per_visit and treatment_catalog
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
header('Content-Type: application/json');

try {
    //session_start();

    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    // Handle IDs - strip "A" prefix from appointment IDs
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

    $patient_id = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;

    if ($visit_id === 0 && $appointment_id === 0 && $patient_id === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'visit_id, appointment_id, or patient_id required']);
        exit;
    }

    $conn = getDBConnection();

    // BASE QUERY for patient_visit data
    $baseSelect = "SELECT 
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
                cg.gender_text as gender,
                CONCAT(s.first_name, ' ', s.last_name) as doctor_name,
                CONCAT(s.first_name, ' ', s.last_name) as nurse_name,
                o.name as office_name";

    $baseFrom = " FROM patient_visit pv
                LEFT JOIN patient p ON pv.patient_id = p.patient_id
                LEFT JOIN codes_gender cg ON p.gender = cg.gender_code
                LEFT JOIN staff d ON pv.doctor_id = d.staff_id
                LEFT JOIN nurse n ON pv.nurse_id = n.nurse_id
                LEFT JOIN staff s ON n.staff_id = s.staff_id
                LEFT JOIN office o ON pv.office_id = o.office_id";

    $rows = [];
    
    if ($appointment_id > 0) {
        // First try to find an existing patient_visit for this appointment
        $sql = $baseSelect . ", a.Appointment_date, a.Reason_for_visit as appointment_reason"
             . $baseFrom
             . " LEFT JOIN appointment a ON pv.appointment_id = a.Appointment_id
                WHERE pv.appointment_id = ?
                ORDER BY pv.date DESC
                LIMIT 1";
        $rows = executeQuery($conn, $sql, 'i', [$appointment_id]);
        
        // If no patient_visit exists, get appointment and patient data
        if (empty($rows)) {
            $apptSql = "SELECT 
                        a.Appointment_id,
                        a.Patient_id,
                        a.Appointment_date,
                        a.Doctor_Staff_ID,
                        a.Reason_for_visit,
                        a.Office_ID,
                        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                        p.dob,
                        p.blood_type,
                        cg.gender_text as gender,
                        CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                        o.name as office_name
                    FROM appointment a
                    LEFT JOIN patient p ON a.Patient_id = p.patient_id
                    LEFT JOIN codes_gender cg ON p.gender = cg.gender_code
                    LEFT JOIN doctor d ON a.Doctor_Staff_ID = d.doctor_id
                    LEFT JOIN office o ON a.Office_ID = o.office_id
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
            $patient_id = $appt['Patient_id'];
            
            // Calculate age
            $age = null;
            if (!empty($appt['dob'])) {
                try {
                    $dob = new DateTime($appt['dob']);
                    $now = new DateTime();
                    $age = $now->diff($dob)->y;
                } catch (Exception $e) {
                    // Keep age as null
                }
            }
            
            // Get allergies from allergies_per_patient table
            $allergiesText = fetchPatientAllergies($conn, $patient_id);
            
            // Return appointment data without patient_visit
            $response = [
                'success' => true,
                'has_visit' => false,
                'appointment' => [
                    'appointment_id' => $appt['Appointment_id'],
                    'patient_id' => $patient_id,
                    'doctor_id' => $appt['Doctor_Staff_ID'],
                    'date' => $appt['Appointment_date'],
                    'reason' => $appt['Reason_for_visit'] ?? '',
                    'office_name' => $appt['office_name'],
                    'doctor_name' => $appt['doctor_name']
                ],
                'visit' => [
                    'visit_id' => null,
                    'appointment_id' => $appt['Appointment_id'],
                    'patient_id' => $patient_id,
                    'date' => $appt['Appointment_date'],
                    'status' => 'Scheduled',
                    'reason' => $appt['Reason_for_visit'] ?? '',
                    'department' => null,
                    'diagnosis' => null,
                    'treatment' => null,
                    'present_illnesses' => null,
                    'start_time' => null,
                    'end_time' => null,
                    'created_at' => null,
                    'created_by' => null,
                    'last_updated' => null,
                    'updated_by' => null,
                    'doctor_name' => $appt['doctor_name'],
                    'nurse_name' => null,
                    'office_name' => $appt['office_name']
                ],
                'vitals' => [
                    'blood_pressure' => null,
                    'temperature' => null,
                    'recorded_by' => null
                ],
                'patient' => [
                    'id' => $patient_id,
                    'name' => $appt['patient_name'],
                    'dob' => $appt['dob'],
                    'age' => $age,
                    'gender' => $appt['gender'],
                    'blood_type' => $appt['blood_type'],
                    'allergies' => $allergiesText,
                    'medicalHistory' => [],
                    'medicationHistory' => [],
                    'chronicConditions' => [],
                    'currentMedications' => []
                ]
            ];
            
            // Fetch additional patient data
            fetchPatientData($conn, $patient_id, $response);
            
            closeDBConnection($conn);
            echo json_encode($response);
            exit;
        }
    } elseif ($visit_id > 0) {
        $sql = $baseSelect . $baseFrom . " WHERE pv.visit_id = ?";
        $rows = executeQuery($conn, $sql, 'i', [$visit_id]);
    } else {
        $sql = $baseSelect . $baseFrom 
             . " WHERE pv.patient_id = ?
                ORDER BY pv.date DESC
                LIMIT 1";
        $rows = executeQuery($conn, $sql, 'i', [$patient_id]);
    }

    if (empty($rows)) {
        http_response_code(404);
        echo json_encode([
            'success' => false, 
            'error' => 'No patient visit found. Patient may not have checked in yet.',
            'has_visit' => false
        ]);
        closeDBConnection($conn);
        exit;
    }

    $visit = $rows[0];

    // Calculate age
    $age = null;
    if (!empty($visit['dob'])) {
        try {
            $dob = new DateTime($visit['dob']);
            $now = new DateTime();
            $age = $now->diff($dob)->y;
        } catch (Exception $e) {
            // Keep age as null
        }
    }

    // Get allergies from allergies_per_patient table
    $allergiesText = fetchPatientAllergies($conn, $visit['patient_id']);

    $response = [
        'success' => true,
        'has_visit' => true,
        'visit' => [
            'visit_id' => $visit['visit_id'],
            'appointment_id' => $visit['appointment_id'],
            'patient_id' => $visit['patient_id'],
            'date' => $visit['date'],
            'status' => $visit['status'],
            'reason' => $visit['reason_for_visit'] ?? $visit['appointment_reason'] ?? '',
            'department' => $visit['department'],
            'diagnosis' => $visit['diagnosis'],
            'treatment' => $visit['treatment'],
            'present_illnesses' => $visit['present_illnesses'],
            'start_time' => $visit['start_at'],
            'end_time' => $visit['end_at'],
            'created_at' => $visit['created_at'],
            'created_by' => $visit['created_by'],
            'last_updated' => $visit['last_updated'],
            'updated_by' => $visit['updated_by'],
            'doctor_name' => $visit['doctor_name'],
            'nurse_name' => $visit['nurse_name'],
            'office_name' => $visit['office_name']
        ],
        'vitals' => [
            'blood_pressure' => $visit['blood_pressure'],
            'temperature' => $visit['temperature'],
            'recorded_by' => $visit['nurse_name']
        ],
        'patient' => [
            'id' => $visit['patient_id'],
            'name' => $visit['patient_name'],
            'dob' => $visit['dob'],
            'age' => $age,
            'gender' => $visit['gender'],
            'blood_type' => $visit['blood_type'],
            'allergies' => $allergiesText,
            'medicalHistory' => [],
            'medicationHistory' => [],
            'chronicConditions' => [],
            'currentMedications' => []
        ]
    ];

    $patient_id = $visit['patient_id'];
    fetchPatientData($conn, $patient_id, $response);

    closeDBConnection($conn);
    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Fetch patient allergies from allergies_per_patient table
 * Returns formatted string of allergies or "No known allergies"
 */
function fetchPatientAllergies($conn, $patient_id) {
    try {
        $allergySql = "SELECT ca.allergies_text 
                       FROM allergies_per_patient app
                       INNER JOIN codes_allergies ca ON app.allergies_code = ca.allergies_code
                       WHERE app.patient_id = ?
                       ORDER BY ca.allergies_text";
        $allergyRows = executeQuery($conn, $allergySql, 'i', [$patient_id]);
        
        if (!empty($allergyRows) && is_array($allergyRows)) {
            $allergyNames = array_map(function($row) {
                return $row['allergies_text'];
            }, $allergyRows);
            return implode(', ', $allergyNames);
        }
        
        return 'No known allergies';
    } catch (Exception $e) {
        error_log("Error fetching allergies: " . $e->getMessage());
        return 'No known allergies';
    }
}

/**
 * Helper function to fetch patient medical data
 */
function fetchPatientData($conn, $patient_id, &$response) {
    // Fetch medical conditions (chronic conditions)
    try {
        $mc_sql = "SELECT condition_name, diagnosis_date FROM medical_condition WHERE patient_id = ? ORDER BY diagnosis_date DESC";
        $mcs = executeQuery($conn, $mc_sql, 'i', [$patient_id]);
        if (is_array($mcs)) {
            $response['patient']['chronicConditions'] = array_map(function($r){
                return $r['condition_name'] ?? '';
            }, $mcs);
            $response['patient']['medicalHistory'] = array_map(function($r){
                return [
                    'condition' => $r['condition_name'] ?? '',
                    'diagnosis_date' => $r['diagnosis_date'] ?? null
                ];
            }, $mcs);
        }
    } catch (Exception $e) {
        error_log("Error fetching conditions: " . $e->getMessage());
    }

    // Fetch medication history
    try {
        $medhist_sql = "SELECT drug_name, duration_and_frequency_of_drug_use FROM medication_history WHERE patient_id = ?";
        $meds_h = executeQuery($conn, $medhist_sql, 'i', [$patient_id]);
        if (is_array($meds_h)) {
            $response['patient']['medicationHistory'] = array_map(function($r){
                return [
                    'drug' => $r['drug_name'] ?? '',
                    'notes' => $r['duration_and_frequency_of_drug_use'] ?? ''
                ];
            }, $meds_h);
        }
    } catch (Exception $e) {
        error_log("Error fetching medication history: " . $e->getMessage());
    }

    // Fetch current prescriptions
    try {
        $rx_sql = "SELECT 
                   p.prescription_id, 
                   p.medication_name as name, 
                   CONCAT(p.dosage, ' - ', p.frequency) as frequency, 
                   CONCAT(d.first_name, ' ', d.last_name) as prescribed_by, 
                   p.start_date, 
                   p.end_date, 
                   p.notes
                   FROM prescription p
                   LEFT JOIN doctor d ON p.doctor_id = d.doctor_id
                   WHERE p.patient_id = ?
                   AND (p.end_date IS NULL OR p.end_date >= CURDATE())
                   ORDER BY p.start_date DESC";
        $rxs = executeQuery($conn, $rx_sql, 'i', [$patient_id]);
        if (is_array($rxs)) {
            $response['patient']['currentMedications'] = array_map(function($m){
                return [
                    'id' => $m['prescription_id'] ?? null,
                    'name' => $m['name'] ?? '',
                    'frequency' => $m['frequency'] ?? '',
                    'prescribed_by' => $m['prescribed_by'] ?? '',
                    'start_date' => $m['start_date'] ?? null,
                    'end_date' => $m['end_date'] ?? null,
                    'instructions' => $m['notes'] ?? ''
                ];
            }, $rxs);
        }
    } catch (Exception $e) {
        error_log("Error fetching prescriptions: " . $e->getMessage());
    }
}
?>