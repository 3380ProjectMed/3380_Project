<?php
require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../_bootstrap.php';

try {
  $date = $_GET['date'] ?? date('Y-m-d');

  $sql = "SELECT a.appointment_id AS id,
                 a.appointment_date       AS time,
                 a.status,
                 a.reason_for_visit       AS reason,
                 p.patient_id             AS patientId,
                 CONCAT(p.first_name,' ',p.last_name) AS patientName
          FROM appointment a
          JOIN patient p ON p.patient_id = a.patient_id
          WHERE DATE(a.appointment_date) = ?
          ORDER BY a.appointment_date ASC";

  $rows = executeQuery($pdo, $sql, 's', [$date]);

  $appointments = array_map(function($r) {
    return [
      'appointmentId' => (int)$r['id'],
      'time'          => $r['time'],
      'status'        => $r['status'],
      'reason'        => $r['reason'],
      'patientId'     => 'p'.$r['patientId'],
      'patientName'   => $r['patientName'],
    ];
  }, $rows);

  echo json_encode(['appointments' => $appointments]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['message' => $e->getMessage()]);
}
