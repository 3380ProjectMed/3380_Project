<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
	$from = $_GET['from'] ?? null;
	$to = $_GET['to'] ?? null;
	$conds = [];
	$types = '';
	$params = [];
	if ($from) { $conds[] = 'DATE(a.Appointment_date) >= ?'; $types .= 's'; $params[] = $from; }
	if ($to) { $conds[] = 'DATE(a.Appointment_date) <= ?'; $types .= 's'; $params[] = $to; }

	$where = '';
	if (!empty($conds)) { $where = ' AND ' . implode(' AND ', $conds); }

	session_start();
	if (empty($_SESSION['uid'])) { http_response_code(401); echo json_encode(['error' => 'Not authenticated']); exit; }
	$userId = (int)$_SESSION['uid'];

	$conn = getDBConnection();
	$sqlHandled = "SELECT COUNT(*) AS cnt FROM Appointment a WHERE a.assigned_nurse_id = ? {$where}";
	$paramsHandled = array_merge([$userId], $params);
	$typesHandled = 'i' . $types;
	$rowsH = executeQuery($conn, $sqlHandled, $typesHandled, $paramsHandled);
	$handled = $rowsH && isset($rowsH[0]['cnt']) ? intval($rowsH[0]['cnt']) : 0;

	$sqlCompleted = "SELECT COUNT(*) AS cnt FROM Appointment a WHERE a.assigned_nurse_id = ? AND a.status = 'Completed' {$where}";
	$rowsC = executeQuery($conn, $sqlCompleted, $typesHandled, $paramsHandled);
	$completed = $rowsC && isset($rowsC[0]['cnt']) ? intval($rowsC[0]['cnt']) : 0;

	$sqlIntake = "SELECT COUNT(*) AS cnt FROM intake i JOIN Appointment a ON i.appointment_id = a.Appointment_id WHERE a.assigned_nurse_id = ? {$where}";
	$rowsI = executeQuery($conn, $sqlIntake, $typesHandled, $paramsHandled);
	$intakeDone = $rowsI && isset($rowsI[0]['cnt']) ? intval($rowsI[0]['cnt']) : 0;

	closeDBConnection($conn);
	echo json_encode(['handled' => $handled, 'completed' => $completed, 'intakeDone' => $intakeDone]);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to compute productivity', 'message' => $e->getMessage()]);
}
