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
    
    // Get all patients with related information
    $query = "SELECT 
                p.patient_id,
                p.first_name,
                p.last_name,
                p.email,
                p.phone,
                p.date_of_birth,
                cg.gender_text as gender,
                p.gender as gender_id,
                p.address,
                p.city,
                p.state,
                p.zip,
                ip.plan_name as insurance_plan,
                ip.company_name as insurance_company,
                p.insurance_plan_id,
                u.is_active
              FROM patient p
              LEFT JOIN user_account u ON p.email = u.email
              LEFT JOIN codes_gender cg ON p.gender = cg.gender_code
              LEFT JOIN insurance_plan ip ON p.insurance_plan_id = ip.plan_id
              WHERE (u.role = 'PATIENT' OR u.role IS NULL)
              ORDER BY p.last_name, p.first_name";
    
    $patients = executeQuery($conn, $query);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'patients' => $patients
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>