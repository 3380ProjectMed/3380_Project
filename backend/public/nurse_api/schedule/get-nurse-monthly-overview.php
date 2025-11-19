<?php
/**
 * get-nurse-monthly-overview.php
 * Get monthly overview for nurse showing patient counts per day
 * 
 * This provides a calendar view showing:
 * - Days the nurse is working
 * - Number of patients assigned each day
 * - Quick summary without full patient details
 */
header('Content-Type: application/json');
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

if (empty($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'UNAUTHENTICATED']);
    exit;
}

try {
    $conn = getDBConnection();
    $email = $_SESSION['email'] ?? '';
    
    // Get nurse_id
    $rows = executeQuery($conn, 
        "SELECT n.nurse_id, CONCAT(s.first_name, ' ', s.last_name) as nurse_name
         FROM nurse n 
         JOIN staff s ON n.staff_id = s.staff_id 
         WHERE s.staff_email = ? LIMIT 1", 
        's', [$email]);
    
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'NURSE_NOT_FOUND']);
        exit;
    }
    
    $nurse_id = (int)$rows[0]['nurse_id'];
    $nurse_name = $rows[0]['nurse_name'];
    
    // Get year and month
    $year = (int)($_GET['year'] ?? date('Y'));
    $month = (int)($_GET['month'] ?? date('n'));
    
    // Validate
    if ($year < 2000 || $year > 2100 || $month < 1 || $month > 12) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid year or month']);
        closeDBConnection($conn);
        exit;
    }
    
    // Get nurse's work schedule (which days of week they work)
    $scheduleQuery = "SELECT 
            day_of_week,
            start_time,
            end_time,
            o.office_id,
            o.name as office_name,
            o.city,
            o.state
        FROM work_schedule ws
        JOIN office o ON ws.office_id = o.office_id
        WHERE ws.nurse_id = ?
        ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')";
    
    $workSchedule = executeQuery($conn, $scheduleQuery, 'i', [$nurse_id]);
    
    // Create map of day_of_week => schedule details
    $scheduleByDay = [];
    foreach ($workSchedule as $sched) {
        $scheduleByDay[$sched['day_of_week']] = [
            'start_time' => substr($sched['start_time'], 0, 5),
            'end_time' => substr($sched['end_time'], 0, 5),
            'office_id' => $sched['office_id'],
            'office_name' => $sched['office_name'],
            'city' => $sched['city'],
            'state' => $sched['state']
        ];
    }
    
    // Get patient counts for each day of the month
    $startDate = sprintf('%04d-%02d-01', $year, $month);
    $endDate = date('Y-m-t', strtotime($startDate)); // Last day of month
    
    $sql = "SELECT 
                DATE(a.Appointment_date) as appointment_date,
                COUNT(DISTINCT pv.visit_id) as patient_count,
                SUM(CASE WHEN (pv.blood_pressure IS NULL AND pv.temperature IS NULL) THEN 1 ELSE 0 END) as needs_vitals_count,
                SUM(CASE WHEN (pv.blood_pressure IS NOT NULL OR pv.temperature IS NOT NULL) THEN 1 ELSE 0 END) as completed_vitals_count
            FROM patient_visit pv
            JOIN appointment a ON pv.appointment_id = a.Appointment_id
            WHERE pv.nurse_id = ?
            AND DATE(a.Appointment_date) BETWEEN ? AND ?
            GROUP BY DATE(a.Appointment_date)
            ORDER BY appointment_date";
    
    $dailyCounts = executeQuery($conn, $sql, 'iss', [$nurse_id, $startDate, $endDate]);
    
    // Create map of date => counts
    $countsByDate = [];
    foreach ($dailyCounts as $day) {
        $countsByDate[$day['appointment_date']] = [
            'total' => (int)$day['patient_count'],
            'needs_vitals' => (int)$day['needs_vitals_count'],
            'completed_vitals' => (int)$day['completed_vitals_count']
        ];
    }
    
    // Build calendar data for entire month
    $daysInMonth = (int)date('t', strtotime($startDate));
    $calendarData = [];
    
    for ($day = 1; $day <= $daysInMonth; $day++) {
        $date = sprintf('%04d-%02d-%02d', $year, $month, $day);
        $dayOfWeek = date('l', strtotime($date)); // Monday, Tuesday, etc.
        
        $isWorking = isset($scheduleByDay[$dayOfWeek]);
        $schedule = $isWorking ? $scheduleByDay[$dayOfWeek] : null;
        
        $counts = $countsByDate[$date] ?? ['total' => 0, 'needs_vitals' => 0, 'completed_vitals' => 0];
        
        $calendarData[] = [
            'date' => $date,
            'day' => $day,
            'day_of_week' => $dayOfWeek,
            'working' => $isWorking,
            'schedule' => $schedule,
            'patient_counts' => $counts
        ];
    }
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'year' => $year,
        'month' => $month,
        'month_name' => date('F', strtotime($startDate)),
        'nurse_name' => $nurse_name,
        'work_schedule' => array_values($scheduleByDay),
        'calendar' => $calendarData,
        'summary' => [
            'total_working_days' => count(array_filter($calendarData, fn($d) => $d['working'])),
            'total_patients' => array_sum(array_column($countsByDate, 'total')),
            'total_needs_vitals' => array_sum(array_map(fn($c) => $c['needs_vitals'], $countsByDate)),
            'total_completed_vitals' => array_sum(array_map(fn($c) => $c['completed_vitals'], $countsByDate))
        ]
    ]);
    
} catch (Exception $e) {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
    http_response_code(500);
    error_log("Error in get-nurse-monthly-overview.php: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}