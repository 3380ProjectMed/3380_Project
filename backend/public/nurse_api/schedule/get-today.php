<?php
// nurse_api/schedule/get-today.php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
    session_start();
    
    // Check authentication
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['error' => 'UNAUTHENTICATED', 'message' => 'Please sign in']);
        exit;
    }

    $conn = getDBConnection();

    // Resolve nurse_id from session email
    $email = $_SESSION['email'] ?? '';
    if (empty($email)) {
        closeDBConnection($conn);
        http_response_code(401);
        echo json_encode(['error' => 'UNAUTHENTICATED', 'message' => 'Please sign in']);
        exit;
    }

    $rows = executeQuery($conn, 
        "SELECT n.nurse_id FROM nurse n 
         JOIN staff s ON n.staff_id = s.staff_id 
         WHERE s.staff_email = ? LIMIT 1", 
        's', 
        [$email]
    );
    
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['error' => 'NURSE_NOT_FOUND', 'message' => 'No nurse record is associated with this account.']);
        exit;
    }

    $nurse_id = (int)$rows[0]['nurse_id'];

    // Get today's date
    $today = date('Y-m-d');

    // Get today's appointments for this nurse's work location
    $sql = "SELECT 
                a.appointment_id as appointmentId,
                DATE_FORMAT(a.appointment_datetime, '%h:%i %p') as time,
                a.appointment_datetime,
                CONCAT(p.first_name, ' ', p.last_name) as patientName,
                p.patient_id as patientId,
                a.reason,
                a.status,
                d.doctor_id as doctorId,
                CONCAT(d.first_name, ' ', d.last_name) as doctorName
            FROM appointment a
            INNER JOIN patient p ON a.patient_id = p.patient_id
            INNER JOIN doctor d ON a.doctor_id = d.doctor_id
            WHERE DATE(a.appointment_datetime) = ?
            AND d.work_location = (
                SELECT s.work_location 
                FROM nurse n 
                INNER JOIN staff s ON n.staff_id = s.staff_id 
                WHERE n.nurse_id = ?
            )
            ORDER BY a.appointment_datetime ASC";

    $appointments = executeQuery($conn, $sql, 'si', [$today, $nurse_id]);

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'data' => $appointments,
        'appointments' => $appointments,  // Both keys for compatibility
        'date' => $today
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB_ERROR', 'message' => $e->getMessage()]);
}
?>