<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
	session_start();
	if (empty($_SESSION['uid'])) { http_response_code(401); echo json_encode(['error' => 'Not authenticated']); exit; }
	$userId = (int)$_SESSION['uid'];

	$conn = getDBConnection();
	$roleRows = executeQuery($conn, 'SELECT role FROM user_account WHERE user_id = ? LIMIT 1', 'i', [$userId]);
	$role = !empty($roleRows) ? $roleRows[0]['role'] : '';
	if ($role !== 'ADMIN') { closeDBConnection($conn); http_response_code(403); echo json_encode(['error'=>'Forbidden']); exit; }

	$body = json_decode(file_get_contents('php://input'), true);
	$id = isset($body['id']) ? intval($body['id']) : 0;
	if (!$id) { closeDBConnection($conn); http_response_code(400); echo json_encode(['error'=>'Missing id']); exit; }

	$stmt = $conn->prepare('UPDATE referrals SET status = "approved", approved_by = ?, approved_at = NOW() WHERE id = ?');
	if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
	$stmt->bind_param('ii', $userId, $id);
	if (!$stmt->execute()) { $stmt->close(); throw new Exception('Failed to approve: ' . $stmt->error); }
	$stmt->close();
	closeDBConnection($conn);

	echo json_encode(['ok' => true]);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to approve referral', 'message' => $e->getMessage()]);
}
