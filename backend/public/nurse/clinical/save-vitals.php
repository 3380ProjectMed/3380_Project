<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
	$apptId = isset($_GET['apptId']) ? intval($_GET['apptId']) : 0;
	if (!$apptId) { http_response_code(400); echo json_encode(['error'=>'Missing apptId']); exit; }

	$body = json_decode(file_get_contents('php://input'), true);
	if (!$body) { http_response_code(400); echo json_encode(['error'=>'Invalid body']); exit; }

	session_start();
	if (empty($_SESSION['uid'])) { http_response_code(401); echo json_encode(['error'=>'Not authenticated']); exit; }
	$userId = (int)$_SESSION['uid'];

	$conn = getDBConnection();

	// Ensure nurse is assigned or admin - try to resolve role from user_account
	$role = '';
	$rowsRole = executeQuery($conn, 'SELECT role FROM user_account WHERE user_id = ? LIMIT 1', 'i', [$userId]);
	if (!empty($rowsRole)) $role = $rowsRole[0]['role'];

	if ($role !== 'ADMIN') {
		$chk = executeQuery($conn, 'SELECT 1 FROM Appointment WHERE Appointment_id = ? AND assigned_nurse_id = ? LIMIT 1', 'ii', [$apptId, $userId]);
		if (empty($chk)) { closeDBConnection($conn); http_response_code(403); echo json_encode(['error'=>'Forbidden']); exit; }
	}

	$bp = $body['bp'] ?? null;
	$hr = $body['hr'] ?? null;
	$temp = $body['temp'] ?? null;
	$spo2 = $body['spo2'] ?? null;
	$height = $body['height'] ?? null;
	$weight = $body['weight'] ?? null;

	// Upsert using INSERT ... ON DUPLICATE KEY UPDATE (assumes appointment_id is PK)
	$sql = "INSERT INTO vitals (appointment_id, bp, hr, temp, spo2, height, weight, recorded_by, recorded_by_role, recorded_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
			ON DUPLICATE KEY UPDATE bp = VALUES(bp), hr = VALUES(hr), temp = VALUES(temp), spo2 = VALUES(spo2), height = VALUES(height), weight = VALUES(weight), recorded_by = VALUES(recorded_by), recorded_by_role = VALUES(recorded_by_role), recorded_at = NOW()";

	// Prepare and execute using mysqli helpers
	$stmt = $conn->prepare($sql);
	if (!$stmt) { throw new Exception('Prepare failed: ' . $conn->error); }
	$recorded_by = $userId; $recorded_by_role = 'NURSE';
	$stmt->bind_param('issssssis', $apptId, $bp, $hr, $temp, $spo2, $height, $weight, $recorded_by, $recorded_by_role);
	if (!$stmt->execute()) { $stmt->close(); throw new Exception('Failed to save vitals: ' . $stmt->error); }
	$stmt->close();

	closeDBConnection($conn);
	echo json_encode(['ok' => true]);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to save vitals', 'message' => $e->getMessage()]);
}
