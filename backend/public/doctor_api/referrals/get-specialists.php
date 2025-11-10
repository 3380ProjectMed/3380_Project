<?php
/**
 * Get specialist doctors (excludes primary care specialties)
 * Excludes: specialty_id IN (1,2,3,4,7) which are primary care specialties
 */

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    session_start();
    
    // Require authentication
    if (!isset($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    $conn = getDBConnection();
    
    // Get current doctor's ID to optionally exclude them
    $current_doctor_id = null;
    $user_id = intval($_SESSION['uid']);
    $currentDoctorRows = executeQuery($conn, 'SELECT d.doctor_id 
                    FROM user_account ua
                    JOIN staff s ON ua.user_id = s.staff_id
                    JOIN doctor d ON s.staff_id = d.staff_id
                    WHERE ua.user_id = ? 
                    LIMIT 1', 'i', [$user_id]);
    if (is_array($currentDoctorRows) && count($currentDoctorRows) > 0) {
        $current_doctor_id = (int)$currentDoctorRows[0]['doctor_id'];
    }
    
    // Get specialist doctors (exclude primary care specialties 1,2,3,4,7)
    $sql = "SELECT 
                d.doctor_id,
                s.first_name,
                s.last_name,
                sp.specialty_name,
                sp.specialty_id
            FROM doctor d
            JOIN staff s ON d.staff_id = s.staff_id
            INNER JOIN user_account ua ON ua.user_id = s.staff_id
            LEFT JOIN specialty sp ON d.specialty = sp.specialty_id
            WHERE d.specialty NOT IN (1, 2, 3, 4, 7)
            ORDER BY sp.specialty_name, s.last_name, s.first_name";
    
    $specialists = executeQuery($conn, $sql, '', []);
    
    // Format response
    $formatted_specialists = [];
    foreach ($specialists as $doc) {
        $doc_id = (int)$doc['doctor_id'];
        
        // Optionally exclude the current logged-in doctor
        if ($current_doctor_id && $doc_id === $current_doctor_id) {
            continue;
        }
        
        $formatted_specialists[] = [
            'id' => $doc_id,
            'doctor_id' => $doc_id,
            'firstName' => $doc['first_name'],
            'lastName' => $doc['last_name'],
            'name' => $doc['first_name'] . ' ' . $doc['last_name'],
            'fullName' => $doc['first_name'] . ' ' . $doc['last_name'],
            'specialty_name' => $doc['specialty_name'] ?: 'Specialist',
            'specialty_id' => $doc['specialty_id']
        ];
    }
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'specialists' => $formatted_specialists,
        'count' => count($formatted_specialists)
    ]);
    
} catch (Exception $e) {
    error_log("Error in get-specialists.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>