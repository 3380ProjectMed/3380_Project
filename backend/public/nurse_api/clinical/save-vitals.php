<?php
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
    $conn  = getDBConnection();
    $email = $_SESSION['email'] ?? '';

    // 1) Resolve nurse_id from staff email
    $rows = executeQuery(
        $conn,
        "SELECT n.nurse_id
           FROM nurse n
           JOIN staff s ON n.staff_id = s.staff_id
          WHERE s.staff_email = ?
          LIMIT 1",
        's',
        [$email]
    );

    if (empty($rows)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'NURSE_NOT_FOUND']);
        closeDBConnection($conn);
        exit;
    }

    $nurse_id = (int)$rows[0]['nurse_id'];

    // 2) Validate appointment_id
    if (empty($_GET['appointment_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing appointment_id']);
        closeDBConnection($conn);
        exit;
    }

    $appointment_id = (int)$_GET['appointment_id'];

    // 3) Make sure a patient_visit exists for this appointment
    $visitRows = executeQuery(
        $conn,
        "SELECT Visit_id
           FROM patient_visit
          WHERE appointment_id = ?
          LIMIT 1",
        'i',
        [$appointment_id]
    );

    if (empty($visitRows)) {
        // For now, we require the visit to be created elsewhere
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'VISIT_NOT_FOUND_FOR_APPOINTMENT']);
        closeDBConnection($conn);
        exit;
    }

    $visit_id = (int)$visitRows[0]['Visit_id'];

    // 4) Parse JSON body for vitals
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON body']);
        closeDBConnection($conn);
        exit;
    }

    // Frontend sends these keys; we map to columns we KNOW exist
    $bp   = $body['bp']   ?? null; // stored in patient_visit.blood_pressure
    $temp = $body['temp'] ?? null; // stored in patient_visit.temperature

    // If you later add more columns (hr, spo2, etc.), extend this UPDATE
    executeQuery(
        $conn,
        "UPDATE patient_visit
            SET blood_pressure = ?,
                temperature   = ?,
                updated_by    = ?,
                updated_at    = NOW()
          WHERE Visit_id = ?",
        'ssii',
        [$bp, $temp, $nurse_id, $visit_id]
    );

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'message' => 'Vitals saved to patient_visit',
        'visitId' => $visit_id,
        'appointmentId' => $appointment_id
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[nurse_api] save-vitals.php error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'INTERNAL_ERROR', 'message' => $e->getMessage()]);
}
