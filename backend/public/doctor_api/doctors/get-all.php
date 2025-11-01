<?php
/**
 * Get all doctors (for admin or dropdowns)
 */

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    session_start();
    
    // Optional: Require authentication
    if (!isset($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    $conn = getDBConnection();
    
    // Get all doctors with their specialty (all lowercase for Azure)
    $sql = "SELECT 
                d.doctor_id,
                d.first_name,
                d.last_name,
                d.email,
                d.phone,
                d.license_number,
                s.specialty_name,
                cg.gender_text as gender
            FROM doctor d
            LEFT JOIN specialty s ON d.specialty = s.specialty_id
            LEFT JOIN codes_gender cg ON d.gender = cg.gender_code
            ORDER BY d.last_name, d.first_name";
    
    $doctors = executeQuery($conn, $sql, '', []);
    
    // Format response
    $formatted_doctors = [];
    foreach ($doctors as $doc) {
        $formatted_doctors[] = [
            'doctor_id' => (int)$doc['doctor_id'],
            'firstName' => $doc['first_name'],
            'lastName' => $doc['last_name'],
            'fullName' => $doc['first_name'] . ' ' . $doc['last_name'],
            'email' => $doc['email'],
            'phone' => $doc['phone'] ?: 'Not provided',
            'licenseNumber' => $doc['license_number'],
            'specialty' => $doc['specialty_name'],
            'gender' => $doc['gender']
        ];
    }
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'doctors' => $formatted_doctors,
        'count' => count($formatted_doctors)
    ]);
    
} catch (Exception $e) {
    error_log("Error in doctors/get-all.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>