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
$date = $_GET['date'] ?? date('Y-m-d');

$sql = "SELECT a.Status FROM appointment a JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id WHERE DATE(a.Appointment_date) = ? AND pv.nurse_id = ?";
$appointments = executeQuery($conn, $sql, 'si', [$date, $nurse_id]);

$total = count($appointments);
$waiting = $upcoming = $completed = 0;
foreach ($appointments as $r) {
  $s = strtolower($r['Status'] ?? '');
  if ($s === 'waiting') $waiting++;
  if (in_array($s, ['scheduled','pending','in progress'], true)) $upcoming++;
  if ($s === 'completed') $completed++;
}

closeDBConnection($conn);
echo json_encode(['date' => $date, 'totalAppointments' => $total, 'waitingCount' => $waiting, 'upcomingCount' => $upcoming, 'completedCount' => $completed]);

          FROM appointment a
          JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id
          WHERE DATE(a.Appointment_date) = ?
          AND pv.nurse_id = ?";

  $appointments = executeQuery($conn, $sql, 'si', [$date, $nurse_id]);
  
  $total = is_array($appointments) ? count($appointments) : 0;
  $waiting = 0; 
  $upcoming = 0; 
  $completed = 0;

  foreach ($appointments as $r) {
    $s = strtolower($r['Status'] ?? '');
    if ($s === 'waiting' || $s === 'in waiting') $waiting++;
    if (in_array($s, ['scheduled','pending','in progress','upcoming'], true)) $upcoming++;
    if ($s === 'completed') $completed++;
  }

  closeDBConnection($conn);

  error_log(sprintf('[nurse_api] get-stats.php nurse_id=%d date=%s total=%d waiting=%d upcoming=%d completed=%d', $nurse_id, $date, $total, $waiting, $upcoming, $completed));

  echo json_encode([
    'success' => true,
    'date' => $date,
    'totalAppointments' => $total,
    'waitingCount' => $waiting,
    'upcomingCount' => $upcoming,
    'completedCount' => $completed
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  error_log('[nurse_api] get-stats.php error: ' . $e->getMessage());
  error_log($e->getTraceAsString());
  echo json_encode(['success' => false, 'error' => 'Failed to load stats', 'message' => $e->getMessage()]);
}
?>