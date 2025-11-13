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
    $today = date('Y-m-d');

    $sql = "SELECT a.Status FROM appointment a JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id WHERE DATE(a.Appointment_date) = ? AND pv.nurse_id = ?";
    $rows = executeQuery($conn, $sql, 'si', [$today, $nurse_id]);

    $total = count($rows);
    $waiting = 0; $upcoming = 0; $completed = 0;
    foreach ($rows as $r) {
        $s = strtolower($r['Status'] ?? '');
        if ($s === 'in waiting' || $s === 'waiting') $waiting++;
        if ($s === 'scheduled' || $s === 'upcoming' || $s === 'pending' || $s === 'in progress') $upcoming++;
        if ($s === 'completed') $completed++;
    }

    closeDBConnection($conn);
    echo json_encode([
        'total' => $total,
        'waiting' => $waiting,
        'upcoming' => $upcoming,
        'completed' => $completed
    ]);
} catch (Throwable $e) {
    closeDBConnection($conn);
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load today appointments', 'message' => $e->getMessage()]);
}
