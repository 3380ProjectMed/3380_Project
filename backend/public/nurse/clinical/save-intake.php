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
	$roleRows = executeQuery($conn, 'SELECT role FROM user_account WHERE user_id = ? LIMIT 1', 'i', [$userId]);
	$role = !empty($roleRows) ? $roleRows[0]['role'] : '';

	if ($role !== 'ADMIN') {
		$chk = executeQuery($conn, 'SELECT 1 FROM Appointment WHERE Appointment_id = ? AND assigned_nurse_id = ? LIMIT 1', 'ii', [$apptId, $userId]);
		if (empty($chk)) { closeDBConnection($conn); http_response_code(403); echo json_encode(['error'=>'Forbidden']); exit; }
	}

	$chief = $body['chiefComplaint'] ?? ($body['chief_complaint'] ?? null);
	$history = $body['history'] ?? null;
	$meds = is_array($body['medications']) ? json_encode($body['medications']) : ($body['medications'] ?? null);
	$allergies = $body['allergies'] ?? null;
	$notes = $body['notes'] ?? null;

	$sql = "INSERT INTO intake (appointment_id, chief_complaint, history, medications, allergies, notes, recorded_by, recorded_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
			ON DUPLICATE KEY UPDATE chief_complaint = VALUES(chief_complaint), history = VALUES(history), medications = VALUES(medications), allergies = VALUES(allergies), notes = VALUES(notes), recorded_by = VALUES(recorded_by), recorded_at = NOW()";

	$stmt = $conn->prepare($sql);
	if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
	$rec = $userId;
	$stmt->bind_param('isssssi', $apptId, $chief, $history, $meds, $allergies, $notes, $rec);
	if (!$stmt->execute()) { $stmt->close(); throw new Exception('Failed to save intake: ' . $stmt->error); }
	$stmt->close();

	closeDBConnection($conn);
	echo json_encode(['ok' => true]);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to save intake', 'message' => $e->getMessage()]);
}
