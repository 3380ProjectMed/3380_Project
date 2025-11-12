<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
header('Content-Type: application/json');

session_start();
if (empty($_SESSION['uid'])) { http_response_code(401); echo json_encode(['error' => 'UNAUTHENTICATED']); exit; }

$conn = getDBConnection();
$email = $_SESSION['email'] ?? '';
$rows = executeQuery($conn, "SELECT n.nurse_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1", 's', [$email]);
if (empty($rows)) { closeDBConnection($conn); http_response_code(404); echo json_encode(['error' => 'NURSE_NOT_FOUND']); exit; }
$nurse_id = (int)$rows[0]['nurse_id'];

try {
    $from = $_GET['from'] ?? null;
    $to = $_GET['to'] ?? null;
    $conds = ['pv.nurse_id = ?'];
    $types = 'i';
    $params = [$nurse_id];
    if ($from) { $conds[] = 'DATE(a.Appointment_date) >= ?'; $types .= 's'; $params[] = $from; }
    if ($to) { $conds[] = 'DATE(a.Appointment_date) <= ?'; $types .= 's'; $params[] = $to; }

    $where = '';
    if (!empty($conds)) { $where = ' AND ' . implode(' AND ', $conds); }

    $sqlHandled = "SELECT COUNT(*) AS cnt FROM appointment a JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id WHERE 1=1 {$where}";
    $rowsH = executeQuery($conn, $sqlHandled, $types, $params);
    $handled = $rowsH && isset($rowsH[0]['cnt']) ? intval($rowsH[0]['cnt']) : 0;

    $sqlCompleted = "SELECT COUNT(*) AS cnt FROM appointment a JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id WHERE a.Status = 'Completed' {$where}";
    $rowsC = executeQuery($conn, $sqlCompleted, $types, $params);
    $completed = $rowsC && isset($rowsC[0]['cnt']) ? intval($rowsC[0]['cnt']) : 0;

    // intakeDone
    $sqlIntake = "SELECT COUNT(*) AS cnt FROM intake i JOIN appointment a ON i.appointment_id = a.Appointment_id JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id WHERE 1=1 {$where}";
    $rowsI = executeQuery($conn, $sqlIntake, $types, $params);
    $intakeDone = $rowsI && isset($rowsI[0]['cnt']) ? intval($rowsI[0]['cnt']) : 0;

    closeDBConnection($conn);
    echo json_encode(['handled' => $handled, 'completed' => $completed, 'intakeDone' => $intakeDone]);
} catch (Throwable $e) {
    closeDBConnection($conn);
    http_response_code(500);
    echo json_encode(['error' => 'Failed to compute productivity', 'message' => $e->getMessage()]);
}
