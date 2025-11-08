<?php
require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../_bootstrap.php';

try {
	$month = $_GET['month'] ?? date('Y-m'); // YYYY-MM
	// get appointments within the month
	$start = $month . '-01';
	$end = date('Y-m-t', strtotime($start));

	$sql = "SELECT a.appointment_id AS id, a.appointment_date AS time, a.status, a.reason_for_visit AS reason,
				   p.patient_id AS patientId, CONCAT(p.first_name,' ',p.last_name) AS patientName
			  FROM appointment a
			  JOIN patient p ON p.patient_id = a.patient_id
			 WHERE DATE(a.appointment_date) BETWEEN ? AND ?
			 ORDER BY a.appointment_date ASC";

	$rows = executeQuery($pdo, $sql, 'ss', [$start, $end]);

	$out = [];
	foreach ($rows as $r) {
		$out[] = [
			'appointmentId' => (int)$r['id'],
			'time' => $r['time'],
			'status' => $r['status'],
			'reason' => $r['reason'],
			'patientId' => 'p'.$r['patientId'],
			'patientName' => $r['patientName']
		];
	}
	echo json_encode(['appointments' => $out]);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to load month appointments', 'message' => $e->getMessage()]);
}
