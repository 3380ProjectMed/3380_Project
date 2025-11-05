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
    
    // Get all receptionists by selecting from staff table
    $query = "SELECT 
                s.staff_id,
                s.first_name,
                s.last_name,
                s.staff_email as email,
                s.ssn,
                cg.gender_text as gender,
                s.gender as gender_id,
                s.work_location,
                o.name as work_location_name,
                o.address as work_location_address,
                s.work_schedule,
                s.license_number,
                u.is_active
              FROM staff s
              LEFT JOIN user_account u ON s.staff_email = u.email
              LEFT JOIN codes_gender cg ON s.gender = cg.gender_code
              LEFT JOIN office o ON s.work_location = o.office_id
              WHERE s.staff_role = 'Receptionist' 
                AND (u.role = 'RECEPTIONIST' OR u.role IS NULL)
              ORDER BY s.last_name, s.first_name";
    
    $receptionists = executeQuery($conn, $query);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'receptionists' => $receptionists
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>