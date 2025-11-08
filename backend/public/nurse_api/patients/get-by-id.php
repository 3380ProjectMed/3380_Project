<?php
declare(strict_types=1);
header('Content-Type: application/json');
require_once __DIR__ . '/../_bootstrap.php';

function fail(int $code, string $msg, array $extra = []): void {
  http_response_code($code);
  echo json_encode(array_merge(['error' => $msg], $extra));
  exit;
}

try {
    $id = $_GET['id'] ?? null;
    if (!$id) fail(400, 'Missing id');

    // accept formats like p5 or 5
    if (preg_match('/^p?(\d+)$/i', $id, $m)) {
        $idNum = (int)$m[1];
    } else {
        fail(400, 'Invalid id');
    }

    $sql = "SELECT p.patient_id, p.first_name, p.last_name, DATE_FORMAT(p.dob, '%Y-%m-%d') AS dob, p.allergies, p.email
            FROM patient p WHERE p.patient_id = ? LIMIT 1";
    $rows = executeQuery($pdo, $sql, 'i', [$idNum]);
    if (empty($rows)) fail(404, 'Patient not found');

    $r = $rows[0];
    echo json_encode([
        'id' => 'p' . $r['patient_id'],
        'firstName' => $r['first_name'] ?? '',
        'lastName' => $r['last_name'] ?? '',
        'dob' => $r['dob'] ?? null,
        'allergies' => $r['allergies'] ?? '',
        'email' => $r['email'] ?? null
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load patient', 'message' => $e->getMessage()]);
}
