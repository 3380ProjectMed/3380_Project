<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
	$apptId = isset($_GET['apptId']) ? intval($_GET['apptId']) : 0;
	if (!$apptId) { http_response_code(400); echo json_encode(['error'=>'Missing apptId']); exit; }

	session_start();
	if (empty($_SESSION['uid'])) { http_response_code(401); echo json_encode(['error'=>'Not authenticated']); exit; }

	$conn = getDBConnection();
	$rows = executeQuery($conn, 'SELECT bp, hr, temp, spo2, height, weight, recorded_by, recorded_by_role, recorded_at FROM vitals WHERE appointment_id = ? LIMIT 1', 'i', [$apptId]);
	closeDBConnection($conn);
	if (empty($rows)) { echo json_encode(null); exit; }
	echo json_encode($rows[0]);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to load vitals', 'message' => $e->getMessage()]);
}
