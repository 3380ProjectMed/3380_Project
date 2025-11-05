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
    
    // Get all nurses by joining staff and nurse tables
    $query = "SELECT 
                n.nurse_id,
                n.staff_id,
                s.first_name,
                s.last_name,
                s.staff_email as email,
                s.ssn,
                s.gender,
                s.work_location,
                s.work_schedule,
                s.license_number,
                n.department,
                u.is_active
              FROM nurse n
              INNER JOIN staff s ON n.staff_id = s.staff_id
              LEFT JOIN user_account u ON s.staff_email = u.email
              WHERE s.staff_role = 'Nurse'
              ORDER BY s.last_name, s.first_name";
    
    $nurses = executeQuery($conn, $query);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'nurses' => $nurses
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>