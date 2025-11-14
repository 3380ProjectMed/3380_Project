<?php
header('Content-Type: application/json');
// /backend/public/nurse_api/schedule/get-work-schedule.php

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

//session_start();
if (empty($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'UNAUTHENTICATED']);
    exit;
}

try {
    $conn = getDBConnection();
    $email = $_SESSION['email'] ?? '';

    // Resolve nurse_id from staff email
    $rows = executeQuery($conn, "SELECT n.nurse_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1", 's', [$email]);
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'NURSE_NOT_FOUND']);
        exit;
    }
    $nurse_id = (int)$rows[0]['nurse_id'];

    // Get work schedule for the nurse
    $sql = "SELECT 
                ws.work_schedule_id,
                ws.day_of_week,
                ws.start_time,
                ws.end_time,
                o.office_id,
                o.name as office_name,
                o.address,
                o.city,
                o.state
            FROM work_schedule ws
            LEFT JOIN office o ON ws.office_id = o.office_id
            WHERE ws.nurse_id = ?
            ORDER BY FIELD(ws.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')";

    $schedule = executeQuery($conn, $sql, 'i', [$nurse_id]);

    // Format the response
    $formattedSchedule = array_map(function ($row) {
        return [
            'day_of_week' => $row['day_of_week'],
            'Day_of_week' => $row['day_of_week'], // Support both formats
            'start_time' => $row['start_time'],
            'Start_time' => $row['start_time'],
            'end_time' => $row['end_time'],
            'End_time' => $row['end_time'],
            'office_id' => $row['office_id'],
            'Office_ID' => $row['office_id'],
            'office_name' => $row['office_name'],
            'address' => $row['address'],
            'city' => $row['city'],
            'City' => $row['city'],
            'state' => $row['state'],
            'State' => $row['state']
        ];
    }, $schedule);

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'data' => $formattedSchedule,
        'schedule' => $formattedSchedule // Support both formats
    ]);
} catch (Exception $e) {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
    http_response_code(500);
    error_log("Error in get-work-schedule.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}
