<?php
//filter-options.php
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
    
    $type = isset($_GET['type']) ? $_GET['type'] : '';
    
    $data = [];
    
    switch ($type) {
        case 'offices':
            $sql = "SELECT 
                        office_id, 
                        name,
                        CONCAT(city, ', ', state) as location
                    FROM office 
                    ORDER BY name";
            $data = executeQuery($conn, $sql, '', []);
            break;
            
        case 'doctors':
            $sql = "SELECT 
                        d.Doctor_id as doctor_id,
                        d.firstName as first_name,
                        d.lastName as last_name,
                        d.specialty,
                        CONCAT(d.firstName, ' ', d.lastName, ' - ', d.specialty) as display_name
                    FROM doctors d
                    JOIN staff s ON d.Staff_id = s.Staff_id
                    WHERE s.is_active = 1
                    ORDER BY d.lastName, d.firstName";
            $data = executeQuery($conn, $sql, '', []);
            break;
            
        case 'insurances':
            $sql = "SELECT 
                        payer_id,
                        name,
                        contact_phone,
                        contact_email
                    FROM insurance_payer 
                    ORDER BY name";
            $data = executeQuery($conn, $sql, '', []);
            break;
            
        default:
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'error' => 'Invalid type parameter. Use offices, doctors, or insurances'
            ]);
            closeDBConnection($conn);
            exit;
    }
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'type' => $type,
        'data' => $data
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>