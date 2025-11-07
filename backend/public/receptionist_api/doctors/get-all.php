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
    
    $sql = "SELECT d.Doctor_id, d.First_Name, d.Last_Name,
                   s.specialty_name, s.specialty_id
            FROM Doctor d
            JOIN Specialty s ON d.Specialty = s.specialty_id
            ORDER BY d.Last_Name, d.First_Name";
    
    $rows = executeQuery($conn, $sql);
    closeDBConnection($conn);

    echo json_encode(['success' => true, 'doctors' => $rows, 'count' => count($rows)]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
