<?php
// Dashboard summary for nurse (mirrors doctor/public endpoints style)
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
	session_start();
	if (empty($_SESSION['uid'])) { http_response_code(401); echo json_encode(['error' => 'Not authenticated']); exit; }
	$userId = (int)$_SESSION['uid'];

	$conn = getDBConnection();
	$today = date('Y-m-d');
	$sql = "SELECT a.status FROM Appointment a WHERE DATE(a.Appointment_date) = ? AND a.assigned_nurse_id = ?";
	$rows = executeQuery($conn, $sql, 'si', [$today, $userId]);

	$total = count($rows);
	$waiting = 0; $upcoming = 0; $completed = 0;
	foreach ($rows as $r) {
		$s = strtolower($r['status'] ?? '');
		if ($s === 'in waiting' || $s === 'waiting') $waiting++;
		if ($s === 'scheduled' || $s === 'upcoming') $upcoming++;
		if ($s === 'completed') $completed++;
	}

	closeDBConnection($conn);
	echo json_encode([
		'total' => $total,
		'waiting' => $waiting,
		'upcoming' => $upcoming,
		'completed' => $completed
	]);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to load dashboard', 'message' => $e->getMessage()]);
}
