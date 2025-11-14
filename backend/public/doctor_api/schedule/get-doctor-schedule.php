<?php

/**
 * Get doctor's work schedule
 */

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    $conn = getDBConnection();

    $doctor_id = null;
    if (isset($_GET['doctor_id'])) {
        $doctor_id = intval($_GET['doctor_id']);
    } else {
        //session_start();
        if (!isset($_SESSION['uid'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Not authenticated']);
            closeDBConnection($conn);
            exit;
        }
        $user_id = intval($_SESSION['uid']);

        $rows = executeQuery($conn, 'SELECT d.doctor_id 
                        FROM user_account ua
                        JOIN staff s ON ua.user_id = s.staff_id
                        JOIN doctor d ON s.staff_id = d.staff_id
                        WHERE ua.user_id = ? 
                        LIMIT 1', 'i', [$user_id]);

        if (empty($rows)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'No doctor associated with user']);
            closeDBConnection($conn);
            exit;
        }
        $doctor_id = (int) $rows[0]['doctor_id'];
    }

    // Get doctor's work schedule with office locations
    // work_schedule now stores staff_id (not doctor_id). join through doctor table
    $sql = "SELECT 
                ws.days AS day_date,
                ws.day_of_week,
                ws.start_time,
                ws.end_time,
                ws.staff_id,
                o.office_id,
                o.name as office_name,
                o.address,
                o.city,
                o.state
            FROM work_schedule ws
            JOIN office o ON ws.office_id = o.office_id
            JOIN doctor d ON ws.staff_id = d.staff_id
            WHERE d.doctor_id = ?
            ORDER BY 
                FIELD(ws.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
                ws.days ASC";

    $schedule = executeQuery($conn, $sql, 'i', [$doctor_id]);

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'doctor_id' => $doctor_id,
        'schedule' => $schedule
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
