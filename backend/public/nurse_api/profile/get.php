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

    $conn = getDBConnection();

    // Prefer matching staff by the session email
    $email = $_SESSION['email'] ?? '';
    if (empty($email)) {
        closeDBConnection($conn);
        http_response_code(401);
        echo json_encode(['error' => 'UNAUTHENTICATED', 'message' => 'Please sign in']);
        exit;
    }

    $sql = "SELECT n.nurse_id, s.first_name, s.last_name, s.staff_email AS email, n.department, s.license_number
            FROM nurse n
            JOIN staff s ON n.staff_id = s.staff_id
            WHERE s.staff_email = ? LIMIT 1";

    $rows = executeQuery($conn, $sql, 's', [$email]);
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['error' => 'NURSE_NOT_FOUND', 'message' => 'No nurse record is associated with this account.']);
        exit;
    }

    $r = $rows[0];
    $profile = [
        'nurseId' => (int)$r['nurse_id'],
        'firstName' => $r['first_name'] ?? '',
        'lastName' => $r['last_name'] ?? '',
        'email' => $r['email'] ?? '',
        'department' => $r['department'] ?? '',
        'licenseNumber' => $r['license_number'] ?? ''
    ];

    closeDBConnection($conn);
    echo json_encode($profile);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB_ERROR', 'message' => $e->getMessage()]);
    exit;
}

?>
