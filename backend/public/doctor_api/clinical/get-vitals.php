<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
	$patient_id = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;
	if ($patient_id === 0) {
		http_response_code(400);
		echo json_encode(['success' => false, 'error' => 'patient_id is required']);
		exit;
	}

	session_start();
	if (!isset($_SESSION['uid'])) {
		http_response_code(401);
		echo json_encode(['success' => false, 'error' => 'Not authenticated']);
		exit;
	}

	$conn = getDBConnection();

	// Attempt to read vitals stored on PatientVisit (if present) ordered by Date desc
	$sql = "SELECT pv.Appointment_id, pv.Patient_id, pv.Date, 
				   pv.Blood_pressure, pv.Heart_rate, pv.Temperature, pv.Respiratory_rate, pv.Oxygen_saturation, pv.Weight
			FROM PatientVisit pv
			WHERE pv.Patient_id = ?
			ORDER BY pv.Date DESC
			LIMIT 50";

	$rows = executeQuery($conn, $sql, 'i', [$patient_id]);
	if (!is_array($rows)) $rows = [];

	// Normalize and filter keys that may not exist
	$vitals = array_map(function($r){
		return [
			'appointment_id' => $r['Appointment_id'] ?? null,
			'patient_id' => $r['Patient_id'] ?? null,
			'date' => $r['Date'] ?? null,
			'blood_pressure' => $r['Blood_pressure'] ?? null,
			'heart_rate' => $r['Heart_rate'] ?? null,
			'temperature' => $r['Temperature'] ?? null,
			'respiratory_rate' => $r['Respiratory_rate'] ?? null,
			'oxygen_saturation' => $r['Oxygen_saturation'] ?? null,
			'weight' => $r['Weight'] ?? null,
		];
	}, $rows);

	closeDBConnection($conn);

	echo json_encode(['success' => true, 'vitals' => $vitals]);

} catch (Exception $e) {
	http_response_code(500);
	echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
