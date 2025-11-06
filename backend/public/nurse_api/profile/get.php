<?php
// nurse_api/profile/get.php
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

    $user_id = (int)$_SESSION['uid'];
    $conn = getDBConnection();

    $sql = "SELECT n.nurse_id, s.staff_id, s.work_location AS office_id, s.first_name, s.last_name
            FROM user_account u
            JOIN staff s ON s.staff_email = u.email
            JOIN nurse n ON n.staff_id = s.staff_id
            WHERE u.user_id = ? AND u.is_active = 1 LIMIT 1";

    $rows = executeQuery($conn, $sql, 'i', [$user_id]);
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['error' => 'NURSE_NOT_FOUND', 'message' => 'No nurse record is associated with this account.']);
        exit;
    }

    $r = $rows[0];
    $profile = [
        'nurseId' => (int)$r['nurse_id'],
        'staffId' => (int)$r['staff_id'],
        'officeId' => (int)$r['office_id'],
        'firstName' => $r['first_name'] ?? '',
        'lastName' => $r['last_name'] ?? '',
    ];

    closeDBConnection($conn);
    echo json_encode($profile);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB_ERROR', 'message' => $e->getMessage()]);
    exit;
}

?>
