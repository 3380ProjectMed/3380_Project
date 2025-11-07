<?php
require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../_bootstrap.php';

try {
    $from = $_GET['from'] ?? null;
    $to = $_GET['to'] ?? null;
    $conds = [];
    $types = '';
    $params = [];
    if ($from) { $conds[] = 'DATE(a.appointment_date) >= ?'; $types .= 's'; $params[] = $from; }
    if ($to) { $conds[] = 'DATE(a.appointment_date) <= ?'; $types .= 's'; $params[] = $to; }

    $where = '';
    if (!empty($conds)) { $where = ' AND ' . implode(' AND ', $conds); }

    $sqlHandled = "SELECT COUNT(*) AS cnt FROM appointment a {$where}";
    $rowsH = executeQuery($pdo, $sqlHandled, $types ?: null, $params ?: []);
    $handled = $rowsH && isset($rowsH[0]['cnt']) ? intval($rowsH[0]['cnt']) : 0;

    $sqlCompleted = "SELECT COUNT(*) AS cnt FROM appointment a WHERE a.status = 'Completed' {$where}";
    $rowsC = executeQuery($pdo, $sqlCompleted, $types ?: null, $params ?: []);
    $completed = $rowsC && isset($rowsC[0]['cnt']) ? intval($rowsC[0]['cnt']) : 0;

    // intakeDone
    $sqlIntake = "SELECT COUNT(*) AS cnt FROM intake i JOIN appointment a ON i.appointment_id = a.appointment_id {$where}";
    $rowsI = executeQuery($pdo, $sqlIntake, $types ?: null, $params ?: []);
    $intakeDone = $rowsI && isset($rowsI[0]['cnt']) ? intval($rowsI[0]['cnt']) : 0;

    echo json_encode(['handled' => $handled, 'completed' => $completed, 'intakeDone' => $intakeDone]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to compute productivity', 'message' => $e->getMessage()]);
}
