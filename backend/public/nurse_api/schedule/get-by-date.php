<?php
declare(strict_types=1);
header('Content-Type: application/json');
require_once __DIR__ . '/../../_bootstrap.php';

function fail(int $code, string $msg, array $extra = []): void {
  http_response_code($code);
  echo json_encode(array_merge(['error' => $msg], $extra));
  exit;
}

try {
    // _bootstrap.php provides: $pdo (mysqli), $userId, $role, $email, $nurseOfficeId
    $email = $email ?? ($_SESSION['email'] ?? '');
    if (empty($email)) fail(401, 'UNAUTHENTICATED');

    // Resolve nurse_id for this user
    $rows = executeQuery($pdo, "SELECT n.nurse_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1", 's', [$email]);
    if (empty($rows)) {
      fail(404, 'NURSE_NOT_FOUND');
    }
    $nurse_id = (int)$rows[0]['nurse_id'];

    $date = $_GET['date'] ?? date('Y-m-d');

    // Get appointments for THIS nurse on this date
    $sql = "SELECT 
                a.appointment_id AS id,
                a.appointment_date AS datetime,
                DATE_FORMAT(a.appointment_date, '%Y-%m-%d %H:%i:%s') AS time_full,
                DATE_FORMAT(a.appointment_date, '%h:%i %p') AS time,
                a.status AS status,
                a.reason AS reason,
                p.patient_id AS patientId,
                CONCAT(p.first_name,' ',p.last_name) AS patientName,
                o.name AS office_name
            FROM appointment a
            JOIN patient p ON p.patient_id = a.patient_id
            LEFT JOIN patient_visit pv ON a.appointment_id = pv.appointment_id
            LEFT JOIN office o ON a.office_id = o.office_id
            WHERE DATE(a.appointment_date) = ?
            AND pv.nurse_id = ?
            ORDER BY a.appointment_date ASC";

    $appointments = executeQuery($pdo, $sql, 'si', [$date, $nurse_id]);

    // Return plain array (not wrapped in {appointments: ...})
    echo json_encode($appointments ?: []);
    
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load schedule', 'message' => $e->getMessage()]);
}
?>