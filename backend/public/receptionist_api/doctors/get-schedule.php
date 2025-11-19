<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/doctors/get-schedule.php
 * ==========================================
 * Get doctor work schedules for a specific date and office
 * Returns working hours for each doctor based on work_schedule table
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    $officeId = isset($_GET['office_id']) ? (int) $_GET['office_id'] : 0;
    $date = isset($_GET['date']) ? $_GET['date'] : null;

    if ($officeId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid office_id required']);
        exit;
    }

    if (!$date) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'date parameter required (YYYY-MM-DD)']);
        exit;
    }

    $conn = getDBConnection();

    // Get the day of week for the given date
    $dayOfWeek = date('l', strtotime($date)); // Monday, Tuesday, etc.

    // Get doctors and their schedules for this office on this day
    $sql = "SELECT DISTINCT 
                d.doctor_id, 
                s.first_name, 
                s.last_name,
                sp.specialty_name, 
                sp.specialty_id,
                ws.start_time,
                ws.end_time,
                ws.day_of_week
            FROM work_schedule ws
            JOIN staff s ON ws.staff_id = s.staff_id
            JOIN doctor d ON s.staff_id = d.staff_id
            JOIN specialty sp ON d.specialty = sp.specialty_id
            WHERE ws.office_id = ?
            AND (
                ws.day_of_week = ? 
                OR (ws.days = ? AND ws.days IS NOT NULL)
            )
            ORDER BY s.last_name, s.first_name";

    $rows = executeQuery($conn, $sql, 'iss', [$officeId, $dayOfWeek, $date]);

    $schedules = array_map(function ($r) {
        // Parse start and end times
        $startTime = null;
        $endTime = null;
        $startHour = 9;
        $endHour = 17;
        
        if (!empty($r['start_time'])) {
            $startParts = explode(':', $r['start_time']);
            $startHour = (int)$startParts[0];
            $startTime = $r['start_time'];
        }
        
        if (!empty($r['end_time'])) {
            $endParts = explode(':', $r['end_time']);
            $endHour = (int)$endParts[0];
            $endTime = $r['end_time'];
        }

        return [
            'Doctor_id' => (int) $r['doctor_id'],
            'First_Name' => $r['first_name'],
            'Last_Name' => $r['last_name'],
            'specialty_name' => $r['specialty_name'],
            'specialty_id' => (int) $r['specialty_id'],
            'start_time' => $startTime,
            'end_time' => $endTime,
            'start_hour' => $startHour,
            'end_hour' => $endHour,
            'day_of_week' => $r['day_of_week']
        ];
    }, $rows);

    closeDBConnection($conn);

    echo json_encode([
        'success' => true, 
        'schedules' => $schedules, 
        'count' => count($schedules),
        'date' => $date,
        'day_of_week' => $dayOfWeek
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}