<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
	// Require patient_id (or appointment_id) as query param
	$patient_id = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;
	$appointment_id = isset($_GET['appointment_id']) ? intval($_GET['appointment_id']) : 0;

	if ($patient_id === 0 && $appointment_id === 0) {
		http_response_code(400);
		echo json_encode(['success' => false, 'error' => 'patient_id or appointment_id is required']);
		exit;
	}

	session_start();
	if (!isset($_SESSION['uid'])) {
		http_response_code(401);
		echo json_encode(['success' => false, 'error' => 'Not authenticated']);
		exit;
	}

	$conn = getDBConnection();

	// If appointment_id provided, limit to that visit
	if ($appointment_id) {
		$sql = "SELECT pv.*, d.First_Name AS doctor_first, d.Last_Name AS doctor_last
				FROM PatientVisit pv
				LEFT JOIN Doctor d ON d.Doctor_id = pv.Doctor_id
				WHERE pv.Appointment_id = ?
				ORDER BY pv.Date DESC LIMIT 1";
		$rows = executeQuery($conn, $sql, 'i', [$appointment_id]);
	} else {
		$sql = "SELECT pv.*, d.First_Name AS doctor_first, d.Last_Name AS doctor_last
				FROM PatientVisit pv
				LEFT JOIN Doctor d ON d.Doctor_id = pv.Doctor_id
				WHERE pv.Patient_id = ?
				ORDER BY pv.Date DESC LIMIT 50";
		$rows = executeQuery($conn, $sql, 'i', [$patient_id]);
	}

	if (!is_array($rows)) $rows = [];

	// Normalize notes: prefer Treatment field as note_text if present
	$notes = array_map(function($r){
		return [
			'visit_id' => $r['PatientVisit_id'] ?? ($r['Visit_id'] ?? null),
			'appointment_id' => $r['Appointment_id'] ?? null,
			'patient_id' => $r['Patient_id'] ?? null,
			'doctor_id' => $r['Doctor_id'] ?? null,
			'doctor_name' => trim((($r['doctor_first'] ?? '') . ' ' . ($r['doctor_last'] ?? ''))),
			'date' => $r['Date'] ?? null,
			'status' => $r['Status'] ?? null,
			'diagnosis' => $r['Diagnosis'] ?? null,
			'note_text' => $r['Treatment'] ?? $r['Notes'] ?? null,
			'created_by' => $r['CreatedBy'] ?? null,
		];
	}, $rows);

	closeDBConnection($conn);

	echo json_encode(['success' => true, 'notes' => $notes]);

} catch (Exception $e) {
	http_response_code(500);
	echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
