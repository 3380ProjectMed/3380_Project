<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
header('Content-Type: application/json');
require_once '/home/site/wwwroot/session.php';
//session_start();
if (empty($_SESSION['uid'])) {
	http_response_code(401);
	echo json_encode(['error' => 'UNAUTHENTICATED']);
	exit;
}

$conn = getDBConnection();
$email = $_SESSION['email'] ?? '';
$rows = executeQuery($conn, "SELECT n.nurse_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1", 's', [$email]);
if (empty($rows)) {
	closeDBConnection($conn);
	http_response_code(404);
	echo json_encode(['error' => 'NURSE_NOT_FOUND']);
	exit;
}
$nurse_id = (int)$rows[0]['nurse_id'];

try {
	$month = $_GET['month'] ?? date('Y-m'); // YYYY-MM
	// get appointments within the month
	$start = $month . '-01';
	$end = date('Y-m-t', strtotime($start));

	$sql = "SELECT a.Appointment_id AS id, a.Appointment_date AS time, a.Status AS status, a.Reason_for_visit AS reason,
				   p.patient_id AS patientId, CONCAT(p.first_name,' ',p.last_name) AS patientName
			  FROM appointment a
			  JOIN patient p ON p.patient_id = a.Patient_id
			  JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id
			 WHERE DATE(a.Appointment_date) BETWEEN ? AND ? AND pv.nurse_id = ?
			 ORDER BY a.Appointment_date ASC";

	$rows = executeQuery($conn, $sql, 'ssi', [$start, $end, $nurse_id]);

	$out = [];
	foreach ($rows as $r) {
		$out[] = [
			'appointmentId' => (int)$r['id'],
			'time' => $r['time'],
			'status' => $r['status'],
			'reason' => $r['reason'],
			'patientId' => 'p' . $r['patientId'],
			'patientName' => $r['patientName']
		];
	}
	closeDBConnection($conn);
	echo json_encode(['appointments' => $out]);
} catch (Throwable $e) {
	closeDBConnection($conn);
	http_response_code(500);
	echo json_encode(['error' => 'Failed to load month appointments', 'message' => $e->getMessage()]);
}
