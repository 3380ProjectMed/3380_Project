<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
	$month = isset($_GET['month']) ? intval($_GET['month']) : intval(date('m'));
	$year = isset($_GET['year']) ? intval($_GET['year']) : intval(date('Y'));
	if ($month < 1 || $month > 12) { http_response_code(400); echo json_encode(['error'=>'Invalid month']); exit; }

	session_start();
	if (empty($_SESSION['uid'])) { http_response_code(401); echo json_encode(['error' => 'Not authenticated']); exit; }
	$userId = (int)$_SESSION['uid'];

	$conn = getDBConnection();
	$sql = "SELECT a.Appointment_id, a.Appointment_date, CONCAT(p.First_Name,' ',p.Last_Name) as patient_name, p.Patient_ID, a.Reason_for_visit
			  FROM Appointment a JOIN Patient p ON a.Patient_id = p.Patient_ID
			 WHERE a.assigned_nurse_id = ? AND MONTH(a.Appointment_date) = ? AND YEAR(a.Appointment_date) = ?
			 ORDER BY a.Appointment_date";

	$rows = executeQuery($conn, $sql, 'iii', [$userId, $month, $year]);

	$out = [];
	foreach ($rows as $apt) {
		$date = date('Y-m-d', strtotime($apt['Appointment_date']));
		$out[] = [
			'id' => 'A' . str_pad($apt['Appointment_id'], 4, '0', STR_PAD_LEFT),
			'patientId' => 'p' . $apt['Patient_ID'],
			'patientName' => $apt['patient_name'],
			'appointment_date' => $apt['Appointment_date'],
			'time' => date('g:i A', strtotime($apt['Appointment_date'])),
			'reason' => $apt['Reason_for_visit'] ?: 'General Visit'
		];
	}

	closeDBConnection($conn);
	echo json_encode(['month' => $month, 'year' => $year, 'appointments' => $out, 'total_count' => count($out)]);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode(['error' => $e->getMessage()]);
}
