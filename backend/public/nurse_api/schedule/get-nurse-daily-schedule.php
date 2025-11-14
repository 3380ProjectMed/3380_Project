<?php
/**
 * Get nurse's daily schedule with assigned patients
 * Path: /backend/public/nurse_api/schedule/get-nurse-daily-schedule.php
 */

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {
    // Verify authentication
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $conn = getDBConnection();
    
    // Get nurse_id from session (matching doctor pattern)
    $nurse_id = null;
    if (isset($_GET['nurse_id'])) {
        $nurse_id = intval($_GET['nurse_id']);
    } else {
        // Get from session - nurse_id is stored in staff table
        $user_id = intval($_SESSION['uid']);
        
        $rows = executeQuery($conn, 
            'SELECT n.nurse_id, CONCAT(s.first_name, " ", s.last_name) as nurse_name
             FROM user_account ua
             JOIN staff s ON ua.user_id = s.staff_id
             JOIN nurse n ON s.staff_id = n.staff_id
             WHERE ua.user_id = ? 
             LIMIT 1', 
            'i', [$user_id]);
        
        if (empty($rows)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'No nurse associated with user']);
            closeDBConnection($conn);
            exit;
        }
        
        $nurse_id = (int)$rows[0]['nurse_id'];
        $nurse_name = $rows[0]['nurse_name'];
    }
    
    // Get date parameter (default to today)
    $date = $_GET['date'] ?? date('Y-m-d');
    
    // Get the day of week for this date
    $dayOfWeek = date('l', strtotime($date)); // Monday, Tuesday, etc.
    
    // Get nurse's work schedule for this day
    $scheduleQuery = "SELECT 
            ws.start_time,
            ws.end_time,
            o.office_id,
            o.name as office_name,
            o.address,
            o.city,
            o.state
        FROM work_schedule ws
        JOIN office o ON ws.office_id = o.office_id
        WHERE ws.nurse_id = ? AND ws.day_of_week = ?
        LIMIT 1";
    
    $scheduleRows = executeQuery($conn, $scheduleQuery, 'is', [$nurse_id, $dayOfWeek]);
    
    // If nurse doesn't work this day
    if (empty($scheduleRows)) {
        closeDBConnection($conn);
        echo json_encode([
            'success' => true,
            'date' => $date,
            'day_of_week' => $dayOfWeek,
            'working' => false,
            'nurse_name' => $nurse_name ?? 'Nurse',
            'appointments' => []
        ]);
        exit;
    }
    
    $workSchedule = $scheduleRows[0];
    
    // Get all appointments assigned to this nurse for this date
    $sql = "SELECT 
                a.Appointment_id as appointment_id,
                a.Appointment_date as appointment_datetime,
                TIME(a.Appointment_date) as appointment_time,
                a.Status as status,
                a.Reason_for_visit as reason,
                pv.visit_id,
                pv.patient_id,
                pv.status as visit_status,
                pv.blood_pressure,
                pv.temperature,
                pv.present_illnesses,
                pv.start_at,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                p.dob,
                TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) as age,
                cg.gender_text as gender,
                CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                d.doctor_id,
                sp.specialty_name,
                o.name as office_name,
                o.office_id
            FROM patient_visit pv
            JOIN appointment a ON pv.appointment_id = a.Appointment_id
            JOIN patient p ON pv.patient_id = p.patient_id
            LEFT JOIN codes_gender cg ON p.gender = cg.gender_code
            LEFT JOIN doctor d ON a.Doctor_id = d.doctor_id
            LEFT JOIN staff s ON d.staff_id = s.staff_id
            LEFT JOIN specialty sp ON d.specialty = sp.specialty_id
            LEFT JOIN office o ON pv.office_id = o.office_id
            WHERE pv.nurse_id = ?
            AND DATE(a.Appointment_date) = ?
            ORDER BY a.Appointment_date ASC";
    
    $appointments = executeQuery($conn, $sql, 'is', [$nurse_id, $date]);
    
    // Format appointments
    $formattedAppointments = array_map(function($apt) {
        $hasVitals = !empty($apt['blood_pressure']) || !empty($apt['temperature']);
        
        return [
            'appointment_id' => $apt['appointment_id'],
            'visit_id' => $apt['visit_id'],
            'patient_id' => $apt['patient_id'],
            'patient_name' => $apt['patient_name'],
            'age' => $apt['age'],
            'gender' => $apt['gender'],
            'dob' => $apt['dob'],
            'appointment_time' => substr($apt['appointment_time'], 0, 5),
            'appointment_datetime' => $apt['appointment_datetime'],
            'reason' => $apt['reason'],
            'doctor_id' => $apt['doctor_id'],
            'doctor_name' => $apt['doctor_name'],
            'specialty' => $apt['specialty_name'],
            'office_name' => $apt['office_name'],
            'office_id' => $apt['office_id'],
            'status' => $apt['status'],
            'visit_status' => $apt['visit_status'],
            'blood_pressure' => $apt['blood_pressure'],
            'temperature' => $apt['temperature'],
            'present_illnesses' => $apt['present_illnesses'],
            'vitals_recorded' => $hasVitals,
            'start_time' => $apt['start_at'],
            'needs_vitals' => !$hasVitals,
            'ready_for_doctor' => $hasVitals
        ];
    }, $appointments ?: []);
    
    // Group by status
    $waitingForVitals = array_filter($formattedAppointments, fn($a) => !$a['vitals_recorded']);
    $readyForDoctor = array_filter($formattedAppointments, fn($a) => $a['vitals_recorded']);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'date' => $date,
        'day_of_week' => $dayOfWeek,
        'working' => true,
        'nurse_name' => $nurse_name ?? 'Nurse',
        'work_schedule' => [
            'start_time' => substr($workSchedule['start_time'], 0, 5),
            'end_time' => substr($workSchedule['end_time'], 0, 5),
            'office_id' => $workSchedule['office_id'],
            'office_name' => $workSchedule['office_name'],
            'address' => $workSchedule['address'],
            'city' => $workSchedule['city'],
            'state' => $workSchedule['state']
        ],
        'appointments' => [
            'all' => $formattedAppointments,
            'waiting_for_vitals' => array_values($waitingForVitals),
            'ready_for_doctor' => array_values($readyForDoctor)
        ],
        'summary' => [
            'total' => count($formattedAppointments),
            'needs_vitals' => count($waitingForVitals),
            'completed_vitals' => count($readyForDoctor)
        ]
    ]);
    
} catch (Exception $e) {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
    http_response_code(500);
    error_log("Error in get-nurse-daily-schedule.php: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage()
    ]);
}