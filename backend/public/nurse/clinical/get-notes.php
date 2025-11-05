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
	$rows = executeQuery($conn, 'SELECT id, author_id AS author, author_role AS authorRole, body, created_at AS createdAt FROM notes WHERE appointment_id = ? ORDER BY created_at DESC', 'i', [$apptId]);
	closeDBConnection($conn);
	echo json_encode($rows);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to load notes', 'message' => $e->getMessage()]);
}
