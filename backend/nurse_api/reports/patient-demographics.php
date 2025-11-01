<?php
require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../_bootstrap.php';

try {
    $from = $_GET['from'] ?? null;
    $to = $_GET['to'] ?? null;
    $conds = [];
    $types = '';
    $params = [];
    if ($from) { $conds[] = 'DATE(a.Appointment_date) >= ?'; $types .= 's'; $params[] = $from; }
    if ($to) { $conds[] = 'DATE(a.Appointment_date) <= ?'; $types .= 's'; $params[] = $to; }
    $where = '';
    if (!empty($conds)) { $where = ' AND ' . implode(' AND ', $conds); }

    // simple gender distribution
    $sqlGender = "SELECT p.Gender AS gender, COUNT(*) AS cnt FROM Appointment a JOIN Patient p ON a.Patient_id = p.Patient_ID WHERE a.assigned_nurse_id = ? {$where} GROUP BY p.Gender";
    $rowsG = executeQuery($pdo, $sqlGender, 'i' . $types, array_merge([$userId], $params));
    $gender = [];
    foreach ($rowsG as $r) { $gender[$r['gender'] ?? 'unknown'] = intval($r['cnt']); }

    // age buckets
    $sqlAge = "SELECT
                  SUM(CASE WHEN TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) < 18 THEN 1 ELSE 0 END) AS under18,
                  SUM(CASE WHEN TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) BETWEEN 18 AND 35 THEN 1 ELSE 0 END) AS age18_35,
                  SUM(CASE WHEN TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) BETWEEN 36 AND 55 THEN 1 ELSE 0 END) AS age36_55,
                  SUM(CASE WHEN TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) > 55 THEN 1 ELSE 0 END) AS over55
                FROM Appointment a JOIN Patient p ON a.Patient_id = p.Patient_ID
                WHERE a.assigned_nurse_id = ? {$where}";
    $rowsA = executeQuery($pdo, $sqlAge, 'i' . $types, array_merge([$userId], $params));
    $age = !empty($rowsA) ? $rowsA[0] : ['under18'=>0,'age18_35'=>0,'age36_55'=>0,'over55'=>0];

    echo json_encode(['gender' => $gender, 'ageBuckets' => $age]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to compute demographics', 'message' => $e->getMessage()]);
}
