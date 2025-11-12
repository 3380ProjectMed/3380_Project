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

$date = $_GET['date'] ?? date('Y-m-d');

$sql = "SELECT a.Appointment_id as appointmentId, a.Appointment_date, a.Status as status, a.Reason_for_visit as reason, p.patient_id as patientId, p.first_name, p.last_name
    FROM appointment a
    JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id
    JOIN patient p ON a.Patient_id = p.patient_id
    WHERE DATE(a.Appointment_date) = ? AND pv.nurse_id = ?
    ORDER BY a.Appointment_date";

$appointments = executeQuery($conn, $sql, 'si', [$date, $nurse_id]);
closeDBConnection($conn);

$out = array_map(function($r) {
  return [
    'appointmentId' => $r['appointmentId'],
    'time' => date('h:i A', strtotime($r['Appointment_date'])),
    'status' => $r['status'],
    'reason' => $r['reason'],
    'patientId' => 'p'.$r['patientId'],
    'patientName' => ($r['first_name'] ?? '') . ' ' . ($r['last_name'] ?? '')
  ];
}, $appointments ?: []);

echo json_encode($out);

?>