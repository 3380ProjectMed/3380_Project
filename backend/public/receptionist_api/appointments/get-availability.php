<?php
/**
 * Get doctor availability for a specific date
 * Uses session-based authentication like doctor API
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    // Start session and require that the user is logged in
    session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    if (!isset($_GET['doctor_id']) || !isset($_GET['date'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'doctor_id and date parameters are required']);
        exit;
    }
    
    $doctor_id = (int)$_GET['doctor_id'];
    $date = $_GET['date'];
    $user_id = (int)$_SESSION['uid'];
    
    // Verify receptionist is authenticated
    $conn = getDBConnection();
    
    try {
        $rows = executeQuery($conn, '
            SELECT s.work_location as office_id
            FROM staff s
            JOIN user_account ua ON ua.email = s.staff_email
            WHERE ua.user_id = ?', 'i', [$user_id]);
    } catch (Exception $ex) {
        closeDBConnection($conn);
        throw $ex;
    }
    
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No receptionist account associated with the logged-in user']);
        exit;
    }
    
    // Get doctor's schedule for the specified date
    $scheduleSql = "SELECT 
                        ws.schedule_id,
                        ws.day_of_week,
                        ws.start_time,
                        ws.end_time,
                        d.first_name,
                        d.last_name
                    FROM work_schedule ws
                    JOIN doctor d ON ws.doctor_id = d.doctor_id
                    WHERE ws.doctor_id = ?
                    AND ws.day_of_week = DAYNAME(?)";
    
    $schedule = executeQuery($conn, $scheduleSql, 'is', [$doctor_id, $date]);
    
    if (empty($schedule)) {
        closeDBConnection($conn);
        echo json_encode([
            'success' => true,
            'available' => false,
            'message' => 'Doctor does not work on this day',
            'slots' => []
        ]);
        exit;
    }
    
    $doctorSchedule = $schedule[0];
    
    // Get existing appointments for this doctor on this date
    $appointmentsSql = "SELECT 
                            Appointment_date,
                            Status
                        FROM appointment
                        WHERE Doctor_id = ?
                        AND DATE(Appointment_date) = ?
                        AND Status NOT IN ('Cancelled', 'No-Show')
                        ORDER BY Appointment_date";
    
    $existingAppointments = executeQuery($conn, $appointmentsSql, 'is', [$doctor_id, $date]);
    
    // Generate time slots (30-minute intervals)
    $startTime = new DateTime($date . ' ' . $doctorSchedule['start_time']);
    $endTime = new DateTime($date . ' ' . $doctorSchedule['end_time']);
    $interval = new DateInterval('PT30M'); // 30 minutes
    
    $slots = [];
    $bookedTimes = array_map(function($apt) {
        return date('H:i:s', strtotime($apt['Appointment_date']));
    }, $existingAppointments);
    
    $currentSlot = clone $startTime;
    while ($currentSlot < $endTime) {
        $slotTime = $currentSlot->format('H:i:s');
        $isAvailable = !in_array($slotTime, $bookedTimes);
        
        $slots[] = [
            'time' => $currentSlot->format('g:i A'),
            'datetime' => $date . ' ' . $slotTime,
            'available' => $isAvailable
        ];
        
        $currentSlot->add($interval);
    }
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'available' => true,
        'doctor' => [
            'id' => $doctor_id,
            'name' => $doctorSchedule['first_name'] . ' ' . $doctorSchedule['last_name']
        ],
        'date' => $date,
        'schedule' => [
            'start_time' => date('g:i A', strtotime($doctorSchedule['start_time'])),
            'end_time' => date('g:i A', strtotime($doctorSchedule['end_time']))
        ],
        'slots' => $slots,
        'total_slots' => count($slots),
        'available_slots' => count(array_filter($slots, function($s) { return $s['available']; }))
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>