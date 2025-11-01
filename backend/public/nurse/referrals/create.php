<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
	session_start();
	if (empty($_SESSION['uid'])) { http_response_code(401); echo json_encode(['error' => 'Not authenticated']); exit; }
	$userId = (int)$_SESSION['uid'];

	$body = json_decode(file_get_contents('php://input'), true);
	if (!$body) { http_response_code(400); echo json_encode(['error'=>'Invalid body']); exit; }

	$patientIdRaw = $body['patientId'] ?? null;
	$toSpecialty = $body['toSpecialty'] ?? ($body['toDepartment'] ?? null);
	$reason = $body['reason'] ?? null;
	$priority = $body['priority'] ?? 'Routine';

	if (!$patientIdRaw || !$toSpecialty) { http_response_code(400); echo json_encode(['error'=>'Missing required fields']); exit; }

	$patientId = preg_replace('/[^0-9]/', '', $patientIdRaw);

	$conn = getDBConnection();
	$stmt = $conn->prepare('INSERT INTO referrals (patient_id, to_specialty, reason, priority, requested_by, requested_by_role, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())');
	if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
	$roleStr = 'NURSE';
	$stmt->bind_param('isssis', $patientId, $toSpecialty, $reason, $priority, $userId, $roleStr);
	if (!$stmt->execute()) { $stmt->close(); throw new Exception('Failed to create referral: ' . $stmt->error); }
	$id = $stmt->insert_id;
	$stmt->close();
	closeDBConnection($conn);

	echo json_encode(['id' => $id, 'createdAt' => date('c')]);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to create referral', 'message' => $e->getMessage()]);
}
