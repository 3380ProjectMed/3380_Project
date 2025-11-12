<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

session_start();
if (empty($_SESSION['uid'])) { http_response_code(401); echo json_encode(['error' => 'UNAUTHENTICATED']); exit; }

$conn = getDBConnection();
$email = $_SESSION['email'] ?? '';
$rows = executeQuery($conn, "SELECT n.nurse_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1", 's', [$email]);
if (empty($rows)) { closeDBConnection($conn); http_response_code(404); echo json_encode(['error' => 'NURSE_NOT_FOUND']); exit; }
$nurse_id = (int)$rows[0]['nurse_id'];

$id = $_GET['id'] ?? null;
if (!$id) { closeDBConnection($conn); http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }

if (preg_match('/^p?(\d+)$/i', $id, $m)) {
    $idNum = (int)$m[1];
} else { closeDBConnection($conn); http_response_code(400); echo json_encode(['error' => 'Invalid id']); exit; }

// Ensure the patient is associated with this nurse via patient_visit
$sql = "SELECT p.patient_id, p.first_name, p.last_name, DATE_FORMAT(p.dob, '%Y-%m-%d') AS dob, p.allergies, p.email
        FROM patient p
        JOIN patient_visit pv ON pv.patient_id = p.patient_id
        WHERE p.patient_id = ? AND pv.nurse_id = ? LIMIT 1";
$rows = executeQuery($conn, $sql, 'ii', [$idNum, $nurse_id]);
if (empty($rows)) { closeDBConnection($conn); http_response_code(404); echo json_encode(['error' => 'Patient not found']); exit; }

$r = $rows[0];
closeDBConnection($conn);
echo json_encode([
    'id' => 'p' . $r['patient_id'],
    'firstName' => $r['first_name'] ?? '',
    'lastName' => $r['last_name'] ?? '',
    'dob' => $r['dob'] ?? null,
    'allergies' => $r['allergies'] ?? '',
    'email' => $r['email'] ?? null
]);
