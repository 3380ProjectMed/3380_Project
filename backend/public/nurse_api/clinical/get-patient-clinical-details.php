<?php
// /backend/public/nurse_api/clinical/get-patient-clinical-details.php

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

header('Content-Type: application/json');

session_start();
if (empty($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'UNAUTHENTICATED']);
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

    // ---- 2. Basic patient info ----
    $patientRows = executeQuery(
        $conn,
        "SELECT *
         FROM patient
         WHERE patient_id = ?
         LIMIT 1",
        'i',
        [$patientId]
    );

    if (empty($patientRows)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'PATIENT_NOT_FOUND']);
        closeDBConnection($conn);
        exit;
    }

    $patient = $patientRows[0];

    // ---- 3. Latest patient_visit (optionally by appointment) ----
    if ($appointmentId > 0) {
        // Try to get visit for this appointment & patient
        $visitRows = executeQuery(
            $conn,
            "SELECT *
             FROM patient_visit
             WHERE patient_id = ?
               AND appointment_id = ?
             ORDER BY patient_visit_id DESC
             LIMIT 1",
            'ii',
            [$patientId, $appointmentId]
        );
    } else {
        // Fallback: latest visit for this patient
        $visitRows = executeQuery(
            $conn,
            "SELECT *
             FROM patient_visit
             WHERE patient_id = ?
             ORDER BY patient_visit_id DESC
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
         ORDER BY medication_history_id DESC",
        'i',
        [$patientId]
    );

    closeDBConnection($conn);

    echo json_encode([
        'success'      => true,
        'patient'      => $patient,
        'visit'        => $visit,
        'allergies'    => $allergyRows,
        'medications'  => $medRows,
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
