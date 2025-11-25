<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    $officeId = isset($_GET['office_id']) ? (int) $_GET['office_id'] : 0;

    if ($officeId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid office_id required']);
        exit;
    }

    $conn = getDBConnection();

    $sql = "SELECT DISTINCT 
                d.doctor_id, 
                s.first_name, 
                s.last_name,
                s.staff_id,
                sp.specialty_name, 
                sp.specialty_id
            FROM work_schedule ws
            JOIN staff s ON ws.staff_id = s.staff_id
            JOIN doctor d ON s.staff_id = d.staff_id
            JOIN specialty sp ON d.specialty = sp.specialty_id
            WHERE ws.office_id = ?
            ORDER BY s.last_name, s.first_name";

    $doctorRows = executeQuery($conn, $sql, 'i', [$officeId]);
    
    $doctors = [];
    
    foreach ($doctorRows as $doctor) {
        $scheduleSQL = "SELECT 
                            day_of_week,
                            start_time,
                            end_time
                        FROM work_schedule
                        WHERE staff_id = ? AND office_id = ?
                        ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')";
        
        $scheduleRows = executeQuery($conn, $scheduleSQL, 'ii', [(int)$doctor['staff_id'], $officeId]);
        
            $workSchedule = [];
        foreach ($scheduleRows as $schedule) {
            if ($schedule['day_of_week']) {
                $workSchedule[] = [
                    'day' => $schedule['day_of_week'],
                    'start' => substr($schedule['start_time'], 0, 5),
                    'end' => substr($schedule['end_time'], 0, 5)
                ];
            }
        }
        
        $doctors[] = [
            'Doctor_id' => (int) $doctor['doctor_id'],
            'First_Name' => $doctor['first_name'],
            'Last_Name' => $doctor['last_name'],
            'specialty_name' => $doctor['specialty_name'],
            'specialty_id' => (int) $doctor['specialty_id'],
            'work_schedule' => $workSchedule
        ];
    }
    
    closeDBConnection($conn);

    echo json_encode(['success' => true, 'doctors' => $doctors, 'count' => count($doctors)]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}