<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

session_start();
if (empty($_SESSION['uid'])) { http_response_code(401); echo json_encode(['error' => 'UNAUTHENTICATED']); exit; }

$conn = getDBConnection();
$email = $_SESSION['email'] ?? '';
$rows = executeQuery($conn, "SELECT n.nurse_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1", 's', [$email]);
if (empty($rows)) { closeDBConnection($conn); http_response_code(404); echo json_encode(['error' => 'NURSE_NOT_FOUND']); exit; }
$nurse_id = (int)$rows[0]['nurse_id'];

try {
    $apptId = isset($_GET['apptId']) ? intval($_GET['apptId']) : 0;
    if (!$apptId) { closeDBConnection($conn); http_response_code(400); echo json_encode(['error' => 'Missing apptId']); exit; }

    // Ensure appointment belongs to this nurse via patient_visit
    $sql = "SELECT a.Appointment_id AS id, a.Appointment_date AS time, a.Status AS status, a.Reason_for_visit AS reason,
                p.patient_id AS patientId, CONCAT(p.first_name,' ',p.last_name) AS patientName,
                DATE_FORMAT(p.dob, '%Y-%m-%d') AS dob, p.allergies AS allergies
            FROM appointment a
            JOIN patient p ON p.patient_id = a.Patient_id
            JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id
           WHERE a.Appointment_id = ? AND pv.nurse_id = ? LIMIT 1";

    $rows = executeQuery($conn, $sql, 'ii', [$apptId, $nurse_id]);
    if (empty($rows)) { closeDBConnection($conn); http_response_code(404); echo json_encode(['error' => 'Appointment not found']); exit; }
    $apt = $rows[0];

    // vitals
    $vrows = executeQuery($conn, 'SELECT bp, hr, temp, spo2, height, weight FROM vitals WHERE appointment_id = ? LIMIT 1', 'i', [$apptId]);
    $vitals = !empty($vrows) ? $vrows[0] : null;

    // intake
    $irows = executeQuery($conn, 'SELECT chief_complaint AS chiefComplaint, history, medications, allergies, notes FROM intake WHERE appointment_id = ? LIMIT 1', 'i', [$apptId]);
    $intake = !empty($irows) ? $irows[0] : null;

    // notes
    $nrows = executeQuery($conn, 'SELECT id, author_id AS author, author_role AS authorRole, body, created_at AS createdAt FROM notes WHERE appointment_id = ? ORDER BY created_at DESC', 'i', [$apptId]);

    $out = [
        'appointment' => [
            'id' => (int)$apt['id'],
            'time' => $apt['time'],
            'status' => $apt['status'],
            'reason' => $apt['reason'],
            'patientId' => 'p' . $apt['patientId'],
            'patientName' => $apt['patientName']
        ],
        'patient' => [
            'id' => 'p' . $apt['patientId'],
            'dob' => $apt['dob'],
            'allergies' => $apt['allergies']
        ],
        'vitals' => $vitals,
        'intake' => $intake,
        'notes' => $nrows
    ];

    closeDBConnection($conn);
    echo json_encode($out);
} catch (Throwable $e) {
    closeDBConnection($conn);
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load summary', 'message' => $e->getMessage()]);
}
