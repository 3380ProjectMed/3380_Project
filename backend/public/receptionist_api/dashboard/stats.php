<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/dashboard/stats.php
 * ==========================================
 * Get dashboard statistics for receptionist
 */
require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../database.php';

try {
    $officeId = isset($_GET['office_id']) ? (int)$_GET['office_id'] : 0;
    $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
    
    if ($officeId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid office_id required']);
        exit;
    }

    $conn = getDBConnection();
    
    // Total appointments for the day
    $totalSql = "SELECT COUNT(*) as total 
                 FROM Appointment 
                 WHERE Office_id = ? AND DATE(Appointment_date) = ?";
    $totalResult = executeQuery($conn, $totalSql, 'is', [$officeId, $date]);
    $total = $totalResult[0]['total'];
    
    // Scheduled appointments
    $scheduledSql = "SELECT COUNT(*) as scheduled 
                     FROM Appointment a
                     LEFT JOIN PatientVisit pv ON a.Appointment_id = pv.Appointment_id
                     WHERE a.Office_id = ? AND DATE(a.Appointment_date) = ?
                     AND (pv.Status IS NULL OR pv.Status = 'Scheduled')";
    $scheduledResult = executeQuery($conn, $scheduledSql, 'is', [$officeId, $date]);
    $scheduled = $scheduledResult[0]['scheduled'];
    
    // Completed appointments
    $completedSql = "SELECT COUNT(*) as completed 
                     FROM Appointment a
                     JOIN PatientVisit pv ON a.Appointment_id = pv.Appointment_id
                     WHERE a.Office_id = ? AND DATE(a.Appointment_date) = ?
                     AND pv.Status = 'Completed'";
    $completedResult = executeQuery($conn, $completedSql, 'is', [$officeId, $date]);
    $completed = $completedResult[0]['completed'];
    
    // Checked in (awaiting payment)
    $checkedInSql = "SELECT COUNT(*) as checked_in 
                     FROM Appointment a
                     JOIN PatientVisit pv ON a.Appointment_id = pv.Appointment_id
                     WHERE a.Office_id = ? AND DATE(a.Appointment_date) = ?
                     AND pv.Status = 'Checked In'";
    $checkedInResult = executeQuery($conn, $checkedInSql, 'is', [$officeId, $date]);
    $checkedIn = $checkedInResult[0]['checked_in'];
    
    // Total revenue collected today
    $revenueSql = "SELECT COALESCE(SUM(p.Payment_amount), 0) as revenue
                   FROM Payment p
                   JOIN Appointment a ON p.Appointment_id = a.Appointment_id
                   WHERE a.Office_id = ? AND DATE(p.Payment_date) = ?";
    $revenueResult = executeQuery($conn, $revenueSql, 'is', [$officeId, $date]);
    $revenue = (float)$revenueResult[0]['revenue'];
    
    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'stats' => [
            'total_appointments' => (int)$total,
            'scheduled' => (int)$scheduled,
            'completed' => (int)$completed,
            'checked_in' => (int)$checkedIn,
            'revenue_collected' => $revenue
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
