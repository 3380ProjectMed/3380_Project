<?php
require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../_bootstrap.php';

try {
    $apptId = isset($_GET['apptId']) ? intval($_GET['apptId']) : 0;
    if (!$apptId) { http_response_code(400); echo json_encode(['error'=>'Missing apptId']); exit; }

    $rows = executeQuery($pdo, 'SELECT id, author_id AS author, author_role AS authorRole, body, created_at AS createdAt FROM notes WHERE appointment_id = ? ORDER BY created_at DESC', 'i', [$apptId]);
    echo json_encode($rows);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load notes', 'message' => $e->getMessage()]);
}
<?php
require_once __DIR__ . '/../_bootstrap.php';

try {
    $apptId = isset($_GET['apptId']) ? intval($_GET['apptId']) : 0;
    if (!$apptId) { http_response_code(400); echo json_encode(['error'=>'Missing apptId']); exit; }

    $rows = executeQuery($pdo, 'SELECT id, author_id AS author, author_role AS authorRole, body, created_at AS createdAt FROM notes WHERE appointment_id = ? ORDER BY created_at DESC', 'i', [$apptId]);
    echo json_encode($rows);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load notes', 'message' => $e->getMessage()]);
}
