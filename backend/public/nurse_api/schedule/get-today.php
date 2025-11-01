<?php
// nurse_api/schedule/get-today.php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
    session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['error' => 'UNAUTHENTICATED', 'message' => 'Please sign in']);
        exit;
    }

    $user_id = (int)$_SESSION['uid'];
    $conn = getDBConnection();

    // resolve office for this nurse via user -> staff -> nurse
    $rows = executeQuery($conn, "SELECT s.work_location AS office_id
                                 FROM user_account u
                                 JOIN staff s ON s.staff_email = u.email
                                 JOIN nurse n ON n.staff_id = s.staff_id
                                 WHERE u.user_id = ? AND u.is_active = 1 LIMIT 1", 'i', [$user_id]);
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['error' => 'NURSE_NOT_FOUND', 'message' => 'No nurse record is associated with this account.']);
        exit;
    }

    $office_id = (int)$rows[0]['office_id'];

    $sql = "SELECT a.appointment_id AS appointmentId,
                   DATE_FORMAT(a.appointment_date, '%Y-%m-%dT%H:%i:%s') AS time,
                   CONCAT(p.first_name, ' ', p.last_name) AS patientName,
                   a.reason_for_visit AS reason,
                   a.status,
                   CONCAT(d.first_name, ' ', d.last_name) AS doctorName
            FROM appointment a
            LEFT JOIN patient p ON p.patient_id = a.patient_id
            LEFT JOIN doctor d ON d.doctor_id = a.doctor_id
            WHERE DATE(a.appointment_date) = CURDATE()
              AND a.office_id = ?
            ORDER BY a.appointment_date ASC";

    $rows = executeQuery($conn, $sql, 'i', [$office_id]);

    // normalize
    foreach ($rows as &$r) {
        $r['appointmentId'] = (int)$r['appointmentId'];
    }

    closeDBConnection($conn);
    echo json_encode($rows);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB_ERROR', 'message' => $e->getMessage()]);
    exit;
}

?>
