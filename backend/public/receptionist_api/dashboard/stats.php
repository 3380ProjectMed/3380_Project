<?php
/**
 * Get dashboard statistics for receptionist's office
 * Uses session-based authentication like doctor API
 */
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    // Start session and require that the user is logged in
    session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    $user_id = (int)$_SESSION['uid'];
    
    // Resolve the receptionist's office ID
    $conn = getDBConnection();
    
    try {
        $rows = executeQuery($conn, '
            SELECT s.Work_Location as office_id, o.Name as office_name
            FROM Staff s
            JOIN user_account ua ON ua.email = s.Staff_Email
            JOIN Office o ON s.Work_Location = o.Office_ID
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
    
    $office_id = (int)$rows[0]['office_id'];
    $office_name = $rows[0]['office_name'];
    
    // Get date parameter or use today
    $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
    
    // Get appointment and payment statistics
    $statsSql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN a.Status = 'Scheduled' AND pv.Visit_id IS NULL THEN 1 ELSE 0 END) as scheduled,
                    SUM(CASE WHEN pv.Visit_id IS NOT NULL AND pv.End_at IS NULL THEN 1 ELSE 0 END) as checked_in,
                    SUM(CASE WHEN pv.Visit_id IS NOT NULL AND pv.End_at IS NOT NULL THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN a.Status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled,
                    COUNT(pv.Payment) as payment_count,
                    COALESCE(SUM(pv.Payment), 0) as total_collected
                 FROM Appointment a
                 LEFT JOIN PatientVisit pv ON a.Appointment_id = pv.Appointment_id
                 WHERE a.Office_id = ? AND DATE(a.Appointment_date) = ?";
    
    $statsResult = executeQuery($conn, $statsSql, 'is', [$office_id, $date]);
    $stats = $statsResult[0] ?? [
        'total' => 0,
        'scheduled' => 0,
        'checked_in' => 0,
        'completed' => 0,
        'cancelled' => 0,
        'payment_count' => 0,
        'total_collected' => 0
    ];
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'total' => (int)$stats['total'],
            'scheduled' => (int)$stats['scheduled'],
            'checked_in' => (int)$stats['checked_in'],
            'completed' => (int)$stats['completed'],
            'cancelled' => (int)$stats['cancelled'],
            'payment_count' => (int)$stats['payment_count'],
            'total_collected' => number_format($stats['total_collected'], 2)
        ],
        'office' => [
            'id' => $office_id,
            'name' => $office_name
        ],
        'date' => $date
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>