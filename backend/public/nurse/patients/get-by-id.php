<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
	$id = $_GET['id'] ?? null;
	if (!$id) {
		http_response_code(400);
		echo json_encode(['error' => 'Missing id']);
		exit;
	}

	session_start();
	if (empty($_SESSION['uid'])) {
		http_response_code(401);
		echo json_encode(['error' => 'Not authenticated']);
		exit;
	}

	// normalize id: allow 'p1001' or numeric
	$idNum = preg_replace('/[^0-9]/', '', $id);

	$sql = "SELECT p.Patient_ID AS id, p.First_Name AS firstName, p.Last_Name AS lastName,
				   DATE_FORMAT(p.DOB, '%Y-%m-%d') AS dob, p.Allergies AS allergies, p.Email AS email, p.Phone AS phone,
				   p.Medical_History AS history, p.Medications AS medications
			  FROM Patient p
			 WHERE p.Patient_ID = ? LIMIT 1";

	$conn = getDBConnection();
	$rows = executeQuery($conn, $sql, 'i', [(int)$idNum]);
	if (empty($rows)) {
		closeDBConnection($conn);
		http_response_code(404);
		echo json_encode(['error' => 'Patient not found']);
		exit;
	}
	$r = $rows[0];
	$out = [
		'id' => 'p' . $r['id'],
		'firstName' => $r['firstName'],
		'lastName' => $r['lastName'],
		'dob' => $r['dob'],
		'allergies' => $r['allergies'],
		'email' => $r['email'],
		'phone' => $r['phone'],
		'history' => $r['history'] ?? '',
		'medications' => $r['medications'] ?? ''
	];

	closeDBConnection($conn);
	echo json_encode($out);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to load patient', 'message' => $e->getMessage()]);
}
