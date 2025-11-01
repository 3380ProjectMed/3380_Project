<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
	session_start();
	if (empty($_SESSION['uid'])) { http_response_code(401); echo json_encode(['error' => 'Not authenticated']); exit; }
	$userId = (int)$_SESSION['uid'];

	$conn = getDBConnection();
	$rows = executeQuery($conn, 'SELECT user_id AS id, username, email, role, phone, work_location AS location, first_name, last_name FROM user_account WHERE user_id = ? LIMIT 1', 'i', [$userId]);
	if (empty($rows)) { closeDBConnection($conn); http_response_code(404); echo json_encode(['error' => 'Profile not found']); exit; }
	$r = $rows[0];
	$out = [
		'firstName' => $r['first_name'] ?? $r['username'] ?? '',
		'lastName' => $r['last_name'] ?? '',
		'email' => $r['email'] ?? '',
		'location' => $r['location'] ?? ''
	];
	closeDBConnection($conn);
	echo json_encode($out);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to load profile', 'message' => $e->getMessage()]);
}
