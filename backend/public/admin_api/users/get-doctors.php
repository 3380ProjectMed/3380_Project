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
                d.first_name,
                d.last_name,
                d.email as email,
                d.phone,
                d.ssn,
                d.license_number,
                cg.gender_text as gender,
                d.gender as gender_id,
                sp.specialty_name as specialization,
                d.specialty,
                o.name as work_location,
                o.address as work_location_address,
                d.work_schedule,
                u.is_active
            FROM doctor d
            LEFT JOIN user_account u ON d.email = u.email
            LEFT JOIN codes_gender cg ON d.gender = cg.gender_code
            LEFT JOIN specialty sp ON d.specialty = sp.specialty_id
            LEFT JOIN office o ON d.work_location = o.office_id
            WHERE u.role = 'DOCTOR' OR u.role IS NULL
            ORDER BY d.last_name, d.first_name;";
                
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