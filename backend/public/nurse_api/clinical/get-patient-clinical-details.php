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

try {
    $conn = getDBConnection();

    // ---- 1. Get & validate patient_id ----
    $patientId = isset($_GET['patient_id']) ? (int)$_GET['patient_id'] : 0;
    if ($patientId <= 0) {
        throw new Exception('MISSING_PATIENT_ID');
    }

    // Optional: appointment_id if UI passes it
    $appointmentId = isset($_GET['appointment_id']) ? (int)$_GET['appointment_id'] : 0;

        // Add debugging
    error_log('[get-patient-clinical-details] Looking for patient_id: ' . $patientId . ', appointment_id: ' . $appointmentId);

    // Get basic patient information
    $patientRows = executeQuery(
        $conn,
        "SELECT * FROM patient WHERE patient_id = ? LIMIT 1",
        'i',
        [$patientId]
    );

    if (empty($patientRows)) {
        error_log('[get-patient-clinical-details] Patient not found for ID: ' . $patientId);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Patient not found']);
        closeDBConnection($conn);
        exit;
    }

    $patient = $patientRows[0];
    error_log('[get-patient-clinical-details] Found patient: ' . $patient['first_name'] . ' ' . $patient['last_name']);

    // ---- 3. Latest patient_visit (optionally by appointment) ----
    if ($appointmentId > 0) {
        error_log('[get-patient-clinical-details] Looking for visit with patient_id: ' . $patientId . ', appointment_id: ' . $appointmentId);
        // Try to get visit for this appointment & patient
        $visitRows = executeQuery(
            $conn,
            "SELECT *
             FROM patient_visit
             WHERE patient_id = ?
               AND appointment_id = ?
             ORDER BY visit_id DESC
             LIMIT 1",
            'ii',
            [$patientId, $appointmentId]
        );
        error_log('[get-patient-clinical-details] Found ' . count($visitRows) . ' visits for appointment');
    } else {
        // Fallback: latest visit for this patient
        $visitRows = executeQuery(
            $conn,
            "SELECT *
             FROM patient_visit
             WHERE patient_id = ?
             ORDER BY visit_id DESC
             LIMIT 1",
            'i',
            [$patientId]
        );
    }

    $visit = $visitRows[0] ?? null;

    // ---- 4. Allergies for this patient ----
    // uses allergies_per_patient + codes_allergies
    $allergyRows = executeQuery(
        $conn,
        "SELECT 
             ap.app_id,
             ap.patient_id,
             ap.allergies_code,
             ap.notes,
             ca.allergies_text
         FROM allergies_per_patient ap
         JOIN codes_allergies ca
           ON ca.allergies_code = ap.allergies_code
         WHERE ap.patient_id = ?
         ORDER BY ca.allergies_text",
        'i',
        [$patientId]
    );

    // ---- 5. Medication history ----
    // we SELECT * so we don't guess column names
    $medRows = executeQuery(
        $conn,
        "SELECT *
         FROM medication_history
         WHERE patient_id = ?
         ORDER BY drug_id DESC",
        'i',
        [$patientId]
    );

    // ---- 6. Format vitals from visit data ----
    $vitals = [
        'bp' => $visit['blood_pressure'] ?? '',
        'hr' => '', // not stored in current schema
        'temp' => $visit['temperature'] ?? '',
        'spo2' => '', // not stored in current schema  
        'height' => '', // not stored in current schema
        'weight' => '', // not stored in current schema
        'notes' => $visit['present_illnesses'] ?? ''
    ];

    // ---- 7. Format allergies ----
    $formattedAllergies = [];
    foreach ($allergyRows as $row) {
        $formattedAllergies[] = [
            'appId' => intval($row['app_id']),
            'allergyId' => intval($row['allergies_code']),
            'name' => $row['allergies_text'],
            'notes' => $row['notes'] ?? ''
        ];
    }

    // ---- 8. Format medications ----
    $formattedMedications = [];
    foreach ($medRows as $row) {
        $formattedMedications[] = [
            'id' => intval($row['drug_id']),
            'name' => $row['drug_name'],
            'dosageAndFrequency' => $row['duration_and_frequency_of_drug_use'] ?? ''
        ];
    }

    // ---- 9. Format patient info ----
    $patientAge = $patient['dob'] ? floor((time() - strtotime($patient['dob'])) / 31556926) : null;

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'patientId' => $patientId,
        'appointmentId' => $appointmentId > 0 ? $appointmentId : null,
        'visitId' => $visit['visit_id'] ?? null,
        'patient' => [
            'patient_id' => $patientId,
            'name' => $patient['first_name'] . ' ' . $patient['last_name'],
            'first_name' => $patient['first_name'],
            'last_name' => $patient['last_name'],
            'dob' => $patient['dob'],
            'age' => $patientAge,
            'gender' => $patient['gender'] ?? 'Unknown',
            'blood_type' => $patient['blood_type']
        ],
        'vitals' => $vitals,
        'allergies' => $formattedAllergies,
        'medications' => $formattedMedications
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    // This goes into the PHP error log so we can see the real cause
    error_log('[nurse_api] get-patient-clinical-details error: ' . $e->getMessage());
    error_log($e->getTraceAsString());

    echo json_encode([
        'success' => false,
        'error'   => 'Failed to load patient details',
        'message' => $e->getMessage()   // helpful while you debug, front-end can ignore
    ]);
}
