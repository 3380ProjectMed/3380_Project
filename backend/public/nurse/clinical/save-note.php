<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
	$apptId = isset($_GET['apptId']) ? intval($_GET['apptId']) : 0;
	if (!$apptId) { http_response_code(400); echo json_encode(['error'=>'Missing apptId']); exit; }

	$body = json_decode(file_get_contents('php://input'), true);
	if (!$body || empty($body['body'])) { http_response_code(400); echo json_encode(['error'=>'Missing body']); exit; }

	session_start();
	if (empty($_SESSION['uid'])) { http_response_code(401); echo json_encode(['error'=>'Not authenticated']); exit; }
	$userId = (int)$_SESSION['uid'];

	$conn = getDBConnection();
	$roleRows = executeQuery($conn, 'SELECT role FROM user_account WHERE user_id = ? LIMIT 1', 'i', [$userId]);
	$role = !empty($roleRows) ? $roleRows[0]['role'] : '';

	if ($role !== 'ADMIN') {
		$chk = executeQuery($conn, 'SELECT 1 FROM Appointment WHERE Appointment_id = ? AND assigned_nurse_id = ? LIMIT 1', 'ii', [$apptId, $userId]);
		if (empty($chk)) { closeDBConnection($conn); http_response_code(403); echo json_encode(['error'=>'Forbidden']); exit; }
	}

	$bodyText = $body['body'];
	$stmt = $conn->prepare('INSERT INTO notes (appointment_id, author_id, author_role, body, created_at) VALUES (?, ?, ?, ?, NOW())');
	if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
	$author_role = 'NURSE';
	$stmt->bind_param('iiss', $apptId, $userId, $author_role, $bodyText);
	if (!$stmt->execute()) { $stmt->close(); throw new Exception('Failed to save note: ' . $stmt->error); }
	$insertId = $stmt->insert_id;
	$stmt->close();

	closeDBConnection($conn);
	echo json_encode(['ok' => true, 'id' => $insertId]);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to save note', 'message' => $e->getMessage()]);
}
