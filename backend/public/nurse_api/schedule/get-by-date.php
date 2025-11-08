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

    // Get appointments for THIS nurse on this date
    $sql = "SELECT 
                a.Appointment_id AS appointmentId,
                DATE_FORMAT(a.Appointment_date, '%h:%i %p') AS time,
                a.Status AS status,
                a.Reason_for_visit AS reason,
                p.patient_id AS patientId,
                CONCAT(p.first_name,' ',p.last_name) AS patientName
            FROM appointment a
            JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id
            JOIN patient p ON p.patient_id = a.Patient_id
            WHERE DATE(a.Appointment_date) = ?
            AND pv.nurse_id = ?
            ORDER BY a.Appointment_date ASC";

    $appointments = executeQuery($conn, $sql, 'si', [$date, $nurse_id]);

    closeDBConnection($conn);

    // Return plain array (not wrapped in {appointments: ...})
    echo json_encode($appointments ?: []);
    
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load schedule', 'message' => $e->getMessage()]);
}
?>