<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

session_start();
if (empty($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['error' => 'UNAUTHENTICATED']);
    exit;
}

$conn = getDBConnection();
$email = $_SESSION['email'] ?? '';
$rows = executeQuery($conn, "SELECT n.nurse_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1", 's', [$email]);
if (empty($rows)) {
    closeDBConnection($conn);
    http_response_code(404);
    echo json_encode(['error' => 'NURSE_NOT_FOUND']);
    exit;
}
$nurse_id = (int)$rows[0]['nurse_id'];

$search = $_GET['q'] ?? '';
$page = max(1, (int)($_GET['page'] ?? 1));
$pageSize = max(1, min(100, (int)($_GET['limit'] ?? 10)));
$offset = ($page - 1) * $pageSize;

if (!empty($search)) {
    $searchParam = "%{$search}%";
    $sql = "SELECT DISTINCT p.patient_id, p.first_name, p.last_name, DATE_FORMAT(p.dob, '%Y-%m-%d') AS dob, p.email, ca.allergies_text as allergies
            FROM patient_visit pv
            JOIN patient p ON pv.patient_id = p.patient_id
            LEFT JOIN codes_allergies ca ON p.allergies = ca.allergies_code
            WHERE pv.nurse_id = ? AND (p.first_name LIKE ? OR p.last_name LIKE ?)
            ORDER BY p.last_name LIMIT ? OFFSET ?";
    $patients = executeQuery($conn, $sql, 'issii', [$nurse_id, $searchParam, $searchParam, $pageSize, $offset]);
    $countSql = "SELECT COUNT(DISTINCT p.patient_id) as total FROM patient_visit pv JOIN patient p ON pv.patient_id = p.patient_id WHERE pv.nurse_id = ? AND (p.first_name LIKE ? OR p.last_name LIKE ?)";
    $countResult = executeQuery($conn, $countSql, 'iss', [$nurse_id, $searchParam, $searchParam]);
} else {
    $sql = "SELECT DISTINCT p.patient_id, p.first_name, p.last_name, DATE_FORMAT(p.dob, '%Y-%m-%d') AS dob, p.email, ca.allergies_text as allergies
            FROM patient_visit pv
            JOIN patient p ON pv.patient_id = p.patient_id
            LEFT JOIN codes_allergies ca ON p.allergies = ca.allergies_code
            WHERE pv.nurse_id = ?
            ORDER BY p.last_name LIMIT ? OFFSET ?";
    $patients = executeQuery($conn, $sql, 'iii', [$nurse_id, $pageSize, $offset]);
    $countSql = "SELECT COUNT(DISTINCT p.patient_id) as total FROM patient_visit pv WHERE pv.nurse_id = ?";
    $countResult = executeQuery($conn, $countSql, 'i', [$nurse_id]);
}

closeDBConnection($conn);
echo json_encode(['success' => true, 'patients' => $patients, 'total' => (int)($countResult[0]['total'] ?? 0), 'page' => $page, 'pageSize' => $pageSize]);

