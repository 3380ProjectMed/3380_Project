<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
	$date = $_GET['date'] ?? date('Y-m-d');
	$status = $_GET['status'] ?? null;
	$q = $_GET['q'] ?? null;

	session_start();
	if (empty($_SESSION['uid'])) {
		http_response_code(401);
		echo json_encode(['error' => 'Not authenticated']);
		exit;
	}
	$userId = (int)$_SESSION['uid'];

	$conn = getDBConnection();

	$sql = "SELECT a.Appointment_id AS id, a.Appointment_date AS time, a.status, a.Reason_for_visit AS reason,
				   p.Patient_ID AS patientId, CONCAT(p.First_Name,' ',p.Last_Name) AS patientName
			  FROM Appointment a
			  JOIN Patient p ON p.Patient_ID = a.Patient_id
			 WHERE DATE(a.Appointment_date) = ?
			   AND a.assigned_nurse_id = ?";

	$types = 'si';
	$params = [$date, $userId];

	if ($status) {
		$sql .= " AND a.status = ?";
		$types .= 's';
		$params[] = $status;
	}
	if ($q) {
		$sql .= " AND (p.First_Name LIKE ? OR p.Last_Name LIKE ? OR p.Patient_ID LIKE ? )";
		$types .= 'sss';
		$like = "%{$q}%";
		$params[] = $like;
		$params[] = $like;
		$params[] = $like;
	}

	$sql .= " ORDER BY a.Appointment_date ASC";

	$rows = executeQuery($conn, $sql, $types, $params);

	$out = [];
	foreach ($rows as $r) {
		$out[] = [
			'id' => (int)$r['id'],
			'time' => $r['time'],
			'status' => $r['status'],
			'reason' => $r['reason'],
			'patientId' => 'p' . $r['patientId'],
			'patientName' => $r['patientName']
		];
	}

	closeDBConnection($conn);
	echo json_encode($out);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to load schedule', 'message' => $e->getMessage()]);
}
