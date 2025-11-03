<?php
require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../_bootstrap.php';

try {
    if ($role !== 'ADMIN') { http_response_code(403); echo json_encode(['error'=>'Forbidden']); exit; }

    $body = json_decode(file_get_contents('php://input'), true);
    $id = isset($body['id']) ? intval($body['id']) : 0;
    if (!$id) { http_response_code(400); echo json_encode(['error'=>'Missing id']); exit; }

    $stmt = $pdo->prepare('UPDATE referrals SET status = "approved", approved_by = ?, approved_at = NOW() WHERE id = ?');
    if (!$stmt) throw new Exception('Prepare failed: ' . $pdo->error);
    $stmt->bind_param('ii', $userId, $id);
    if (!$stmt->execute()) throw new Exception('Failed to approve: ' . $stmt->error);
    $stmt->close();

    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to approve referral', 'message' => $e->getMessage()]);
}
