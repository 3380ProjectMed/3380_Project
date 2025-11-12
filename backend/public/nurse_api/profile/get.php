<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

session_start();
if (empty($_SESSION['uid'])) { http_response_code(401); echo json_encode(['error' => 'UNAUTHENTICATED']); exit; }

$conn = getDBConnection();
$email = $_SESSION['email'] ?? '';

$sql = "SELECT ua.username, ua.email, ua.role, s.first_name, s.last_name, s.license_number, s.work_location AS office_id, n.department, o.name AS office_name, o.address, o.city, o.state, o.zipcode
        FROM user_account ua
        LEFT JOIN staff s ON s.staff_email = ua.email
        LEFT JOIN nurse n ON n.staff_id = s.staff_id
        LEFT JOIN office o ON o.office_id = s.work_location
        WHERE ua.email = ? LIMIT 1";

$rows = executeQuery($conn, $sql, 's', [$email]);
if (empty($rows)) {
    closeDBConnection($conn);
    http_response_code(404);
    echo json_encode(['error' => 'Profile not found']);
    exit;
}

$r = $rows[0];
$location = null;
if (!empty($r['office_id'])) {
    $location = [
        'officeId' => (int)$r['office_id'],
        'name' => $r['office_name'] ?? null,
        'address' => $r['address'] ?? null,
        'city' => $r['city'] ?? null,
        'state' => $r['state'] ?? null,
        'zipcode' => $r['zipcode'] ?? null,
    ];
}

closeDBConnection($conn);
echo json_encode([
    'firstName' => $r['first_name'] ?? $r['username'] ?? '',
    'lastName' => $r['last_name'] ?? '',
    'email' => $r['email'] ?? '',
    'department' => $r['department'] ?? '',
    'licenseNumber' => $r['license_number'] ?? '',
    'location' => $location
]);
