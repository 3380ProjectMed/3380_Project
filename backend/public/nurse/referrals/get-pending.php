<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
	session_start();
	if (empty($_SESSION['uid'])) { http_response_code(401); echo json_encode(['error' => 'Not authenticated']); exit; }
	$userId = (int)$_SESSION['uid'];

	$conn = getDBConnection();
	// Resolve role
	$roleRows = executeQuery($conn, 'SELECT role FROM user_account WHERE user_id = ? LIMIT 1', 'i', [$userId]);
	$role = !empty($roleRows) ? $roleRows[0]['role'] : '';

	if ($role === 'ADMIN') {
		$rows = executeQuery($conn, 'SELECT id, patient_id AS patientId, to_specialty AS to, reason, priority, requested_by AS requestedBy, requested_by_role AS requestedByRole, created_at FROM referrals WHERE status = "pending" ORDER BY created_at DESC');
	} else {
		$rows = executeQuery($conn, 'SELECT id, patient_id AS patientId, to_specialty AS to, reason, priority, requested_by AS requestedBy, requested_by_role AS requestedByRole, created_at FROM referrals WHERE requested_by = ? ORDER BY created_at DESC', 'i', [$userId]);
	}
	closeDBConnection($conn);
	echo json_encode($rows);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to load referrals', 'message' => $e->getMessage()]);
}
