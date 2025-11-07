<?php
require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../_bootstrap.php';

try {
    $q = $_GET['q'] ?? null;
    $page = max(1, intval($_GET['page'] ?? 1));
    $pageSize = max(1, intval($_GET['pageSize'] ?? 25));
    $offset = ($page - 1) * $pageSize;

    $where = "";
    $types = '';
    $params = [];

    if ($q) {
        $where = " WHERE (p.first_name LIKE ? OR p.last_name LIKE ? OR p.patient_id LIKE ?)";
        $like = "%{$q}%";
        $types = 'sss';
        $params = [$like, $like, $like];
    }

    $sql = "SELECT SQL_CALC_FOUND_ROWS p.patient_id AS id, CONCAT(p.first_name,' ',p.last_name) AS name,
                   DATE_FORMAT(p.dob, '%Y-%m-%d') AS dob, p.allergies AS allergies, p.email AS email, p.phone AS phone
              FROM patient p" . $where . " ORDER BY p.last_name, p.first_name LIMIT ? OFFSET ?";

    $types .= 'ii';
    $params[] = $pageSize;
    $params[] = $offset;

    $rows = executeQuery($pdo, $sql, $types, $params);

    // get total
    $totalRows = executeQuery($pdo, 'SELECT FOUND_ROWS() as cnt');
    $total = $totalRows && isset($totalRows[0]['cnt']) ? (int)$totalRows[0]['cnt'] : count($rows);

    $items = [];
    foreach ($rows as $r) {
        $items[] = [
            'id' => 'p' . $r['id'],
            'name' => $r['name'],
            'dob' => $r['dob'],
            'allergies' => $r['allergies'],
            'email' => $r['email'],
            'phone' => $r['phone']
        ];
    }

    echo json_encode(['patients' => $items, 'total' => $total]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load patients', 'message' => $e->getMessage()]);
}
