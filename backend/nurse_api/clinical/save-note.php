<?php
require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../_bootstrap.php';

try {
    $apptId = isset($_GET['apptId']) ? intval($_GET['apptId']) : 0;
    if (!$apptId) { http_response_code(400); echo json_encode(['error'=>'Missing apptId']); exit; }

    $body = json_decode(file_get_contents('php://input'), true);
    if (!$body || empty($body['body'])) { http_response_code(400); echo json_encode(['error'=>'Missing body']); exit; }

    if ($role !== 'ADMIN') {
        $chk = executeQuery($pdo, 'SELECT 1 FROM Appointment WHERE Appointment_id = ? AND assigned_nurse_id = ? LIMIT 1', 'ii', [$apptId, $userId]);
        if (empty($chk)) { http_response_code(403); echo json_encode(['error'=>'Forbidden']); exit; }
    }

    $bodyText = $body['body'];
    $stmt = $pdo->prepare('INSERT INTO notes (appointment_id, author_id, author_role, body, created_at) VALUES (?, ?, ?, ?, NOW())');
    if (!$stmt) throw new Exception('Prepare failed: ' . $pdo->error);
    $author_role = 'NURSE';
    $stmt->bind_param('iiss', $apptId, $userId, $author_role, $bodyText);
    if (!$stmt->execute()) throw new Exception('Failed to save note: ' . $stmt->error);
    $insertId = $stmt->insert_id;
    $stmt->close();

    echo json_encode(['ok' => true, 'id' => $insertId]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save note', 'message' => $e->getMessage()]);
}
