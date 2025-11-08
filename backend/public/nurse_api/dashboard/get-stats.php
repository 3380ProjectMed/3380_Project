<?php
declare(strict_types=1);
header('Content-Type: application/json');
require_once __DIR__ . '/../_bootstrap.php';
// backend database helper (mysqli) already loaded by bootstrap

function fail(int $code, string $msg, array $extra = []): void {
  http_response_code($code);
  echo json_encode(array_merge(['error' => $msg], $extra));
  exit;
}

try {
  $date = $_GET['date'] ?? date('Y-m-d');

  $types = 's';
  $params = [$date];
  $sql = "SELECT a.status FROM appointment a WHERE DATE(a.appointment_date) = ?";
  if (!empty($nurseOfficeId)) {
    $sql .= " AND a.office_id = ?";
    $types .= 'i';
    $params[] = $nurseOfficeId;
  }

  $rows = executeQuery($pdo, $sql, $types, $params);
  $total = is_array($rows) ? count($rows) : 0;
  $waiting = 0; $upcoming = 0; $completed = 0;

  foreach ($rows as $r) {
    $s = strtolower($r['status'] ?? '');
    if ($s === 'waiting' || $s === 'in waiting') $waiting++;
    if (in_array($s, ['scheduled','pending','in progress','upcoming'], true)) $upcoming++;
    if ($s === 'completed') $completed++;
  }

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
