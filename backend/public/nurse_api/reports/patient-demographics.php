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

try {
    $from = $_GET['from'] ?? null;
    $to = $_GET['to'] ?? null;
    $conds = ['pv.nurse_id = ?'];
    $types = 'i';
    $params = [$nurse_id];
    if ($from) { $conds[] = 'DATE(a.Appointment_date) >= ?'; $types .= 's'; $params[] = $from; }
    if ($to) { $conds[] = 'DATE(a.Appointment_date) <= ?'; $types .= 's'; $params[] = $to; }
    $where = '';
    if (!empty($conds)) { $where = ' AND ' . implode(' AND ', $conds); }

    // simple gender distribution (limited to this nurse's patients via patient_visit)
    $sqlGender = "SELECT p.gender AS gender, COUNT(*) AS cnt FROM appointment a JOIN patient p ON a.Patient_id = p.patient_id JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id WHERE 1=1 {$where} GROUP BY p.gender";
    $rowsG = executeQuery($conn, $sqlGender, $types, $params);
    $gender = [];
    foreach ($rowsG as $r) { $gender[$r['gender'] ?? 'unknown'] = intval($r['cnt']); }

    // age buckets
    $sqlAge = "SELECT
                  SUM(CASE WHEN TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) < 18 THEN 1 ELSE 0 END) AS under18,
                  SUM(CASE WHEN TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) BETWEEN 18 AND 35 THEN 1 ELSE 0 END) AS age18_35,
                  SUM(CASE WHEN TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) BETWEEN 36 AND 55 THEN 1 ELSE 0 END) AS age36_55,
                  SUM(CASE WHEN TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) > 55 THEN 1 ELSE 0 END) AS over55
                FROM appointment a JOIN patient p ON a.Patient_id = p.patient_id JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id
                WHERE 1=1 {$where}";
    $rowsA = executeQuery($conn, $sqlAge, $types, $params);
    $age = !empty($rowsA) ? $rowsA[0] : ['under18'=>0,'age18_35'=>0,'age36_55'=>0,'over55'=>0];

    closeDBConnection($conn);
    echo json_encode(['gender' => $gender, 'ageBuckets' => $age]);
} catch (Throwable $e) {
    closeDBConnection($conn);
    http_response_code(500);
    echo json_encode(['error' => 'Failed to compute demographics', 'message' => $e->getMessage()]);
}
