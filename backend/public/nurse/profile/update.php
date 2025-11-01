<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
	session_start();
	if (empty($_SESSION['uid'])) { http_response_code(401); echo json_encode(['error'=>'Not authenticated']); exit; }
	$userId = (int)$_SESSION['uid'];

	$body = json_decode(file_get_contents('php://input'), true);
	if (!$body) { http_response_code(400); echo json_encode(['error'=>'Invalid body']); exit; }

	$fields = [];
	$types = '';
	$params = [];
	$allowed = ['phone','email','workLocation','work_location'];
	foreach ($allowed as $k) {
		if (isset($body[$k])) {
			$fields[] = ($k === 'workLocation' ? 'work_location' : $k) . ' = ?';
			$types .= 's';
			$params[] = $body[$k];
		}
	}

	if (empty($fields)) {
		http_response_code(400);
		echo json_encode(['error' => 'No updatable fields provided']);
		exit;
	}

	$sql = 'UPDATE user_account SET ' . implode(', ', $fields) . ' WHERE user_id = ?';
	$types .= 'i';
	$params[] = $userId;

	$conn = getDBConnection();
	$stmt = $conn->prepare($sql);
	if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
	$stmt->bind_param($types, ...$params);
	if (!$stmt->execute()) { $stmt->close(); throw new Exception('Update failed: ' . $stmt->error); }
	$stmt->close();

	// return updated profile
	$rows = executeQuery($conn, 'SELECT email, phone, work_location AS location FROM user_account WHERE user_id = ? LIMIT 1', 'i', [$userId]);
	closeDBConnection($conn);
	echo json_encode(['ok' => true, 'profile' => $rows[0] ?? null]);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to update profile', 'message' => $e->getMessage()]);
}
