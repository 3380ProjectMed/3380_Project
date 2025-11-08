<?php
declare(strict_types=1);
header('Content-Type: application/json');
require_once __DIR__ . '/../_bootstrap.php';

function fail(int $code, string $msg, array $extra = []): void {
  http_response_code($code);
  echo json_encode(array_merge(['error' => $msg], $extra));
  exit;
}

try {
    $date = $_GET['date'] ?? date('Y-m-d');

    $types = 's';
    $params = [$date];
    $sql = "SELECT a.appointment_id AS id,
                   a.appointment_date AS time,
                   a.status,
                   a.reason_for_visit AS reason,
                   p.patient_id AS patientId,
                   CONCAT(p.first_name,' ',p.last_name) AS patientName
            FROM appointment a
            JOIN patient p ON p.patient_id = a.patient_id
            WHERE DATE(a.appointment_date) = ?";

    if (!empty($nurseOfficeId)) {
      $sql .= " AND a.office_id = ?";
      $types .= 'i';
      $params[] = $nurseOfficeId;
    }

    $sql .= " ORDER BY a.appointment_date ASC";

    $rows = executeQuery($pdo, $sql, $types, $params);

    $out = [];
    foreach ($rows as $r) {
      $out[] = [
        'id' => (int)$r['id'],
        'time' => $r['time'],
        'status' => $r['status'],
        'reason' => $r['reason'],
        'patientId' => 'p' . $r['patientId'],
        'patientName' => $r['patientName']
      ];
    }

    echo json_encode(['appointments' => $out]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load schedule', 'message' => $e->getMessage()]);
}
