<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    session_start();
    
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }
    
    $conn = getDBConnection();
    
    // Get overall statistics
    $stats = [];
    
    // Total doctors
    $result = executeQuery($conn, 'SELECT COUNT(*) as count FROM doctor');
    $stats['total_doctors'] = $result[0]['count'];
    
    // Total nurses
    $result = executeQuery($conn, 'SELECT COUNT(*) as count FROM nurse');
    $stats['total_nurses'] = $result[0]['count'];
    
    // Total patients
    $result = executeQuery($conn, 'SELECT COUNT(*) as count FROM Patient');
    $stats['total_patients'] = $result[0]['count'];
    
    // Total appointments (this month)
    $result = executeQuery($conn, 
        'SELECT COUNT(*) as count FROM appointment WHERE MONTH(Appointment_date) = MONTH(CURRENT_DATE) AND YEAR(Appointment_date) = YEAR(CURRENT_DATE)'
    );
    $stats['appointments_this_month'] = $result[0]['count'];
    
    // Active users
    $result = executeQuery($conn, 'SELECT COUNT(*) as count FROM user_account WHERE is_active = 1');
    $stats['active_users'] = $result[0]['count'];
    
    // Pending appointments (today)
    $result = executeQuery($conn, 
        "SELECT COUNT(*) as count FROM appointment WHERE DATE(Appointment_date) = CURRENT_DATE AND Status IN ('Scheduled', 'Waiting')"
    );
    $stats['pending_appointments'] = $result[0]['count'];
    
    // Completed today
    $result = executeQuery($conn, 
        "SELECT COUNT(*) as count FROM appointment WHERE DATE(Appointment_date) = CURRENT_DATE AND Status = 'Completed'"
    );
    $stats['completed_today'] = $result[0]['count'];
    
    // Revenue today (from PatientVisit)
    $result = executeQuery($conn, 
        'SELECT COALESCE(SUM(payment), 0) as total FROM patient_visit WHERE DATE(Date) = CURRENT_DATE'
    );
    $stats['revenue_today'] = floatval($result[0]['total']);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'stats' => $stats
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>