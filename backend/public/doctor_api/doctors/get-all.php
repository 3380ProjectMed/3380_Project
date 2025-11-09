<?php
/**
 * Get all doctors (for admin or dropdowns)
 * FIXED: Excludes the logged-in doctor from the list
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
    
    // Get the current logged-in doctor's ID to exclude them from the list
    $current_doctor_id = null;
    $user_id = isset($_SESSION['uid']) ? intval($_SESSION['uid']) : null;
    if ($user_id) {
        $currentDoctorRows = executeQuery($conn, 'SELECT d.doctor_id FROM doctor d JOIN user_account ua ON ua.email = d.email WHERE ua.user_id = ? LIMIT 1', 'i', [$user_id]);
        if (is_array($currentDoctorRows) && count($currentDoctorRows) > 0) {
            $current_doctor_id = (int)$currentDoctorRows[0]['doctor_id'];
        }
    }
    
    // Get all doctors with their specialty (all lowercase for Azure)
    $sql = "SELECT 
                st.doctor_id,
                st.first_name,
                st.last_name,
                st.staff_email,
                d.phone,
                st.license_number,
                s.specialty_name,
                cg.gender_text as gender
            FROM staff st
            LEFT JOIN doctor d ON st.staff_id = d.staff_id
            LEFT JOIN specialty s ON d.specialty = s.specialty_id
            LEFT JOIN codes_gender cg ON st.gender = cg.gender_code
            ORDER BY st.last_name, st.first_name";
    
    $doctors = executeQuery($conn, $sql, '', []);
    
    // Format response - exclude the current logged-in doctor
    $formatted_doctors = [];
    foreach ($doctors as $doc) {
        $doc_id = (int)$doc['doctor_id'];
        
        // Skip the current logged-in doctor
        if ($current_doctor_id && $doc_id === $current_doctor_id) {
            continue;
        }
        
        $formatted_doctors[] = [
            'doctor_id' => $doc_id,
            'id' => $doc_id, // Add 'id' field for frontend compatibility
            'firstName' => $doc['first_name'],
            'lastName' => $doc['last_name'],
            'name' => $doc['first_name'] . ' ' . $doc['last_name'], // Add 'name' field for dropdown
            'fullName' => $doc['first_name'] . ' ' . $doc['last_name'],
            'email' => $doc['email'],
            'phone' => $doc['phone'] ?: 'Not provided',
            'licenseNumber' => $doc['license_number'],
            'specialty' => $doc['specialty_name'],
            'specialty_name' => $doc['specialty_name'], // Add for consistency
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