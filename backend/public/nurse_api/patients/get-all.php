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
    $q = trim((string)($_GET['q'] ?? ''));
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = max(1, min(50, (int)($_GET['limit'] ?? 10)));
    $offset = ($page - 1) * $limit;

    $params = [];
    $where = '';
    $types = '';
    if ($q !== '') {
        // if query looks like p123 or numeric, search by id
        if (preg_match('/^p?(\d+)$/i', $q, $m)) {
            $where = ' WHERE p.patient_id = ?';
            $types .= 'i';
            $params[] = (int)$m[1];
        } else {
            $like = "%{$q}%";
            $where = ' WHERE (p.first_name LIKE ? OR p.last_name LIKE ? OR CONCAT(p.first_name, " ", p.last_name) LIKE ?)';
            $types .= 'sss';
            $params[] = $like; $params[] = $like; $params[] = $like;
        }
    }

    $sql = "SELECT SQL_CALC_FOUND_ROWS p.patient_id AS patient_id, p.first_name, p.last_name, DATE_FORMAT(p.dob, '%Y-%m-%d') AS dob, p.allergies
            FROM patient p {$where} ORDER BY p.last_name, p.first_name LIMIT ? OFFSET ?";

    $types .= 'ii';
    $params[] = $limit; $params[] = $offset;

    $rows = executeQuery($pdo, $sql, $types, $params);

    $cntRows = executeQuery($pdo, 'SELECT FOUND_ROWS() AS total');
    $total = isset($cntRows[0]['total']) ? (int)$cntRows[0]['total'] : count($rows ?: []);

    $items = array_map(function($r) {
        return [
            'patient_id' => 'p' . $r['patient_id'],
            'first_name' => $r['first_name'],
            'last_name'  => $r['last_name'],
            'dob'        => $r['dob'],
            'allergies'  => $r['allergies'],
        ];
    }, $rows ?: []);

    echo json_encode(['items' => $items, 'total' => $total]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load patients', 'message' => $e->getMessage()]);
}
