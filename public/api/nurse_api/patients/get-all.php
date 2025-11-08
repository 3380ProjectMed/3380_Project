<?php
require_once __DIR__ . '/../_bootstrap.php';

try {
    $q = trim((string)($_GET['q'] ?? ''));
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = max(1, intval($_GET['limit'] ?? 10));
    $offset = ($page - 1) * $limit;

    $params = [];
    $where = '';
    if ($q !== '') {
        // if query starts with 'p' followed by digits, search by patient_id
        if (preg_match('/^p?(\d+)$/i', $q, $m)) {
            $where = ' WHERE p.patient_id = ?';
            $params[] = intval($m[1]);
        } else {
            $like = '%' . $q . '%';
            $where = ' WHERE (p.first_name LIKE ? OR p.last_name LIKE ? OR CONCAT(p.first_name, " ", p.last_name) LIKE ?)';
            $params[] = $like; $params[] = $like; $params[] = $like;
        }
    }

    $sql = "SELECT p.patient_id AS patient_id, p.first_name, p.last_name, DATE_FORMAT(p.dob, '%Y-%m-%d') AS dob, p.allergies
            FROM patient p" . $where . " ORDER BY p.last_name, p.first_name LIMIT ? OFFSET ?";

    // add limit/offset to params
    $params[] = $limit; $params[] = $offset;

    $rows = executeQuery($pdo, $sql, null, $params);

    // total count
    $countSql = "SELECT COUNT(*) AS cnt FROM patient p" . $where;
    // use same where params (without limit/offset)
    $countParams = array_slice($params, 0, max(0, count($params) - 2));
    $countRows = executeQuery($pdo, $countSql, null, $countParams);
    $total = isset($countRows[0]['cnt']) ? intval($countRows[0]['cnt']) : 0;

    echo json_encode(['items' => $rows ?: [], 'total' => $total]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to list patients', 'message' => $e->getMessage()]);
}
