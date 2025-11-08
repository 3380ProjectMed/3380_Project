<?php
require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../_bootstrap.php';

try {
  $date = $_GET['date'] ?? date('Y-m-d');

  // Schema uses lowercase table/columns
  $sql = "SELECT status FROM appointment WHERE DATE(appointment_date) = ?";
  $rows = executeQuery($pdo, $sql, 's', [$date]);

  $total = count($rows);
  $waiting = 0; $upcoming = 0; $completed = 0;
  foreach ($rows as $r) {
    $s = strtolower($r['status'] ?? '');
    if ($s === 'waiting' || $s === 'in waiting') $waiting++;
    if ($s === 'scheduled' || $s === 'pending' || $s === 'in progress' || $s === 'upcoming') $upcoming++;
    if ($s === 'completed') $completed++;
  }

  echo json_encode([
    'totalAppointments' => $total,
    'waitingCount'      => $waiting,
    'upcomingCount'     => $upcoming,
    'completedCount'    => $completed
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['message' => $e->getMessage()]);
}
