<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/appointments/get-availability.php
 * ==========================================
 * Get doctor availability (booked slots) for a specific date
 */
require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../database.php';

try {
    $doctorId = isset($_GET['doctor_id']) ? (int)$_GET['doctor_id'] : 0;
    $date = isset($_GET['date']) ? $_GET['date'] : '';
    
    if ($doctorId <= 0 || empty($date)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'doctor_id and date required']);
        exit;
    }

    $conn = getDBConnection();
    
    // Get doctor's schedule for this day of week
    $dayOfWeek = date('w', strtotime($date)); // 0=Sunday, 6=Saturday
    
    $scheduleSql = "SELECT Start_time, End_time FROM DoctorSchedule 
                    WHERE Doctor_id = ? AND Day_of_week = ?";
    $scheduleRows = executeQuery($conn, $scheduleSql, 'ii', [$doctorId, $dayOfWeek]);
    
    if (empty($scheduleRows)) {
        echo json_encode([
            'success' => true, 
            'working' => false,
            'booked_slots' => []
        ]);
        exit;
    }
    
    // Get booked appointment times for this date
    $apptSql = "SELECT TIME(Appointment_date) as appointment_time 
                FROM Appointment 
                WHERE Doctor_id = ? AND DATE(Appointment_date) = ?
                AND Appointment_id NOT IN (
                    SELECT Appointment_id FROM PatientVisit WHERE Status = 'Canceled'
                )";
    $bookedSlots = executeQuery($conn, $apptSql, 'is', [$doctorId, $date]);
    
    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'working' => true,
        'start_time' => $scheduleRows[0]['Start_time'],
        'end_time' => $scheduleRows[0]['End_time'],
        'booked_slots' => array_map(fn($r) => $r['appointment_time'], $bookedSlots)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
