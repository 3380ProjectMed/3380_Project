<?php
declare(strict_types=1);
header('Content-Type: application/json');
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

function fail(int $code, string $msg, array $extra = []): void {
  http_response_code($code);
  echo json_encode(array_merge(['error' => $msg], $extra));
  exit;
}

try {
  session_start();
  if (empty($_SESSION['uid'])) {
    fail(401, 'UNAUTHENTICATED');
  }

  $conn = getDBConnection();

  // Get nurse_id from session
  $email = $_SESSION['email'] ?? '';
  $rows = executeQuery($conn, "SELECT n.nurse_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1", 's', [$email]);
  if (empty($rows)) {
    closeDBConnection($conn);
    fail(404, 'NURSE_NOT_FOUND');
  }

  $nurse_id = (int)$rows[0]['nurse_id'];
  $date = $_GET['date'] ?? date('Y-m-d');

  // Get appointments for THIS nurse only
  $sql = "SELECT a.Status 
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

  echo json_encode([
    'date' => $date,
    'totalAppointments' => $total,
    'waitingCount' => $waiting,
    'upcomingCount' => $upcoming,
    'completedCount' => $completed
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Failed to load stats', 'message' => $e->getMessage()]);
}
?>