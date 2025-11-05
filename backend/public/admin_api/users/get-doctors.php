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
    
    // Get all doctors with related information
    $query = "SELECT 
                d.doctor_id,
                d.staff_id,
                s.first_name,
                s.last_name,
                s.staff_email as email,
                s.phone_number,
                s.ssn,
                s.license_number,
                cg.name as gender,
                s.gender as gender_id,
                sp.name as specialization,
                d.specialty_id,
                o.office_name as work_location,
                o.address as work_location_address,
                s.work_location as work_location_id,
                s.work_schedule,
                u.is_active
              FROM doctor d
              INNER JOIN staff s ON d.staff_id = s.staff_id
              LEFT JOIN user_account u ON s.staff_email = u.email
              LEFT JOIN codes_gender cg ON s.gender = cg.gender_id
              LEFT JOIN specialty sp ON d.specialty_id = sp.specialty_id
              LEFT JOIN office o ON s.work_location = o.office_id
              WHERE s.staff_role = 'Doctor'
              ORDER BY s.last_name, s.first_name";
    
    $doctors = executeQuery($conn, $query);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'doctors' => $doctors
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>