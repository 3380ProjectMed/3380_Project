<?php
// nurse_api/schedule/get-today.php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
    session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['error' => 'UNAUTHENTICATED', 'message' => 'Please sign in']);
        exit;
    }

    $conn = getDBConnection();

    // resolve nurse_id from the logged-in session email
    $email = $_SESSION['email'] ?? '';
    if (empty($email)) {
        closeDBConnection($conn);
        http_response_code(401);
        echo json_encode(['error' => 'UNAUTHENTICATED', 'message' => 'Please sign in']);
        exit;
    }

    $rows = executeQuery($conn, "SELECT n.nurse_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1", 's', [$email]);
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['error' => 'NURSE_NOT_FOUND', 'message' => 'No nurse record is associated with this account.']);
        exit;
    }

    $nurse_id = (int)$rows[0]['nurse_id'];

    $sql = "SELECT schedule_id AS scheduleId, days AS date, day_of_week AS dayOfWeek, start_time AS startTime, end_time AS endTime, office_id
            FROM work_schedule
            WHERE nurse_id = ?
            ORDER BY days, start_time";

    $schedules = executeQuery($conn, $sql, 'i', [$nurse_id]);

    // normalize types
    foreach ($schedules as &$s) {
        $s['scheduleId'] = (int)$s['scheduleId'];
        $s['officeId'] = isset($s['office_id']) ? (int)$s['office_id'] : null;
    }

    closeDBConnection($conn);
    echo json_encode($schedules);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB_ERROR', 'message' => $e->getMessage()]);
    exit;
}

?>
