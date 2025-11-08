<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/doctors/get-all.php
 * ==========================================
 * Get all doctors (no office filter)
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    $conn = getDBConnection();
    
    $sql = "SELECT d.doctor_id, d.first_name, d.last_name,
                   s.specialty_name, s.specialty_id
            FROM doctor d
            JOIN specialty s ON d.specialty = s.specialty_id
            ORDER BY d.last_name, d.first_name";
    
    $rows = executeQuery($conn, $sql);
    closeDBConnection($conn);

    echo json_encode(['success' => true, 'doctors' => $rows, 'count' => count($rows)]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}