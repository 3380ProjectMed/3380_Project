<?php
// Update appointment status proxy
// Expects apptId and status in POST body or query
// Delegates to internal nurse_api implementation if available, otherwise performs a simple update.
try {
    // prefer internal implementation if present
    $path = __DIR__ . '/../../../nurse_api/schedule/update-status.php';
    if (file_exists($path)) {
        require_once $path;
        exit;
    }

    require_once __DIR__ . '/../../../lib/db.php';
    // simple updater using mysqli helpers
    require_once __DIR__ . '/../../../database.php';
    $apptId = $_GET['apptId'] ?? null;
    if (!$apptId && isset($_POST['apptId'])) $apptId = $_POST['apptId'];
    $status = $_GET['status'] ?? null;
    if (!$status && isset($_POST['status'])) $status = $_POST['status'];
    if (!$apptId || !$status) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'apptId and status required']);
        exit;
    }
    $conn = getDBConnection();
    $sql = 'UPDATE Appointment SET status = ? WHERE Appointment_id = ?';
    $rows = executeQuery($conn, $sql, 'si', [$status, intval($apptId)]);
    closeDBConnection($conn);
    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
