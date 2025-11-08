<?php
require_once __DIR__ . '/../_bootstrap.php';

try {
    $id = $_GET['id'] ?? null;
    if (empty($id)) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }

    // accept formats like p5 or 5
    if (preg_match('/^p?(\d+)$/i', $id, $m)) {
        $idNum = intval($m[1]);
    } else {
        http_response_code(400); echo json_encode(['error' => 'Invalid id']); exit;
    }

    $sql = "SELECT p.patient_id AS id, p.first_name, p.last_name, DATE_FORMAT(p.dob, '%Y-%m-%d') AS dob, p.allergies FROM patient p WHERE p.patient_id = ? LIMIT 1";
    $rows = executeQuery($pdo, $sql, 'i', [$idNum]);
    if (empty($rows)) { http_response_code(404); echo json_encode(['error' => 'Patient not found']); exit; }

    $r = $rows[0];
    echo json_encode([
        'id' => 'p' . $r['id'],
        'firstName' => $r['first_name'] ?? '',
        'lastName' => $r['last_name'] ?? '',
        'dob' => $r['dob'] ?? null,
        'allergies' => $r['allergies'] ?? ''
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch patient', 'message' => $e->getMessage()]);
}
