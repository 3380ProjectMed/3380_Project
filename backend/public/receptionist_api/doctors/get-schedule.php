<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/doctors/get-schedule.php
 * ==========================================
 * Get doctor's schedule for a specific date
 */
require_once __DIR__ . '/home/site/wwwroot/cors.php';
require_once __DIR__ . '/home/site/wwwroot/database.php';

try {
    $doctorId = isset($_GET['doctor_id']) ? (int)$_GET['doctor_id'] : 0;
    $date = isset($_GET['date']) ? $_GET['date'] : '';
    
    if ($doctorId <= 0 || empty($date)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'doctor_id and date required']);
        exit;
    }

    $conn = getDBConnection();
    
    $dayOfWeek = date('l', strtotime($date)); // Returns day name (Monday, Tuesday, etc.)
    
    $sql = "SELECT Schedule_id, Day_of_week, Start_time, End_time
            FROM WorkSchedule
            WHERE Doctor_id = ? AND Day_of_week = ?";
    
    $rows = executeQuery($conn, $sql, 'is', [$doctorId, $dayOfWeek]);
    closeDBConnection($conn);

    if (empty($rows)) {
        echo json_encode(['success' => true, 'working' => false]);
    } else {
        echo json_encode([
            'success' => true,
            'working' => true,
            'schedule' => $rows[0]
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
