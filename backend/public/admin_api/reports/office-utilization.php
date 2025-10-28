<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    session_start();
    
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }
    
    $conn = getDBConnection();
    
    // Get date range from query params (default: last 30 days)
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-d', strtotime('-30 days'));
    $end_date = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d');
    
    // Validate dates
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid date format. Use YYYY-MM-DD']);
        exit;
    }
    
    // Office statistics with appointment details
    // Note: Office table has columns: Office_ID, Name, City, State, address, ZipCode, DeptCount, Phone
    $sql = "SELECT 
                o.Office_ID,
                o.Name as office_name,
                CONCAT(o.address, ', ', o.City, ', ', o.State, ' ', o.ZipCode) as address,
                COUNT(a.Appointment_id) as total_appointments,
                COUNT(CASE WHEN a.Status = 'Completed' THEN 1 END) as completed,
                COUNT(CASE WHEN a.Status = 'Cancelled' THEN 1 END) as cancelled,
                COUNT(CASE WHEN a.Status = 'No-Show' THEN 1 END) as no_shows,
                COUNT(CASE WHEN a.Status = 'Scheduled' THEN 1 END) as scheduled,
                COUNT(CASE WHEN a.Status = 'Waiting' THEN 1 END) as waiting,
                ROUND(
                    COUNT(CASE WHEN a.Status = 'No-Show' THEN 1 END) * 100.0 / NULLIF(COUNT(a.Appointment_id), 0),
                    1
                ) as no_show_rate,
                ROUND(AVG(TIMESTAMPDIFF(MINUTE, a.Appointment_date, pv.Start_at)), 0) as avg_wait_minutes,
                ROUND(
                    COUNT(a.Appointment_id) * 100.0 / NULLIF(DATEDIFF(?, ?) + 1, 0),
                    1
                ) as utilization_rate
            FROM Office o
            LEFT JOIN Appointment a ON o.Office_ID = a.Office_id 
                AND DATE(a.Appointment_date) BETWEEN ? AND ?
            LEFT JOIN PatientVisit pv ON a.Appointment_id = pv.Appointment_id
            GROUP BY o.Office_ID
            ORDER BY total_appointments DESC";
    
    $office_stats = executeQuery($conn, $sql, 'ssss', [$end_date, $start_date, $start_date, $end_date]);
    
    // Calculate summary statistics
    $total_offices = count($office_stats);
    $total_appointments = 0;
    $total_no_shows = 0;
    $sum_utilization = 0;
    
    foreach ($office_stats as $office) {
        $total_appointments += intval($office['total_appointments']);
        $total_no_shows += intval($office['no_shows']);
        $sum_utilization += floatval($office['utilization_rate']);
    }
    
    $avg_utilization = $total_offices > 0 ? round($sum_utilization / $total_offices, 1) : 0;
    $avg_no_show_rate = $total_appointments > 0 ? round(($total_no_shows / $total_appointments) * 100, 1) : 0;
    
    $summary = [
        'total_offices' => $total_offices,
        'total_appointments' => $total_appointments,
        'avg_utilization' => $avg_utilization,
        'avg_no_show_rate' => $avg_no_show_rate
    ];
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'start_date' => $start_date,
        'end_date' => $end_date,
        'summary' => $summary,
        'office_stats' => $office_stats
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>