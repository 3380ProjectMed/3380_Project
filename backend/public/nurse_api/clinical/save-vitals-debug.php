<?php
header('Content-Type: application/json');
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
//session_start();
if (empty($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'UNAUTHENTICATED']);
    exit;
}

try {
    $conn = getDBConnection();
    $email = $_SESSION['email'] ?? '';

    error_log('[save-vitals-debug] Starting debug save for email: ' . $email);

    // Get form data
    $appointmentId = (int)($_POST['appointmentId'] ?? 0);
    $bp = trim($_POST['bp'] ?? '');
    $temp = trim($_POST['temp'] ?? '');

    if (!$appointmentId) {
        throw new Exception('Invalid appointment ID');
    }

    error_log('[save-vitals-debug] Looking for visit with appointment_id: ' . $appointmentId);

    $visitRows = executeQuery(
        $conn,
        "SELECT visit_id, patient_id, blood_pressure, temperature FROM patient_visit WHERE appointment_id = ? LIMIT 1",
        'i',
        [$appointmentId]
    );

    if (empty($visitRows)) {
        throw new Exception('No patient visit found for appointment ' . $appointmentId);
    }

    $visitId = $visitRows[0]['visit_id'];
    $patientId = $visitRows[0]['patient_id'];

    error_log('[save-vitals-debug] Found visit_id: ' . $visitId . ', patient_id: ' . $patientId);
    error_log('[save-vitals-debug] Current BP: ' . $visitRows[0]['blood_pressure'] . ', Temp: ' . $visitRows[0]['temperature']);

    // Now try a simple update
    $sql = "UPDATE patient_visit SET blood_pressure = ?, temperature = ?, updated_by = ?, last_updated = NOW() WHERE visit_id = ?";

    error_log('[save-vitals-debug] About to execute: ' . $sql);
    error_log('[save-vitals-debug] Parameters: BP=' . $bp . ', Temp=' . $temp . ', Email=' . $email . ', VisitID=' . $visitId);

    executeQuery($conn, $sql, 'sdsi', [$bp, (float)$temp, $email, $visitId]);

    error_log('[save-vitals-debug] Update completed successfully');

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'message' => 'Debug save completed',
        'visitId' => $visitId,
        'appointmentId' => $appointmentId,
        'patientId' => $patientId,
        'bp' => $bp,
        'temp' => $temp
    ]);
} catch (Throwable $e) {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
    http_response_code(500);
    error_log('[save-vitals-debug] Error: ' . $e->getMessage());
    error_log('[save-vitals-debug] Stack trace: ' . $e->getTraceAsString());

    echo json_encode([
        'success' => false,
        'error' => 'DEBUG_SAVE_FAILED',
        'message' => $e->getMessage(),
        'appointmentId' => $appointmentId ?? 'unknown'
    ]);
}
