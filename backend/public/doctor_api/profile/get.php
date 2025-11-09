<?php
/**
 * Get doctor profile
 * Updated for Azure database
 */

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    session_start();

    if (isset($_GET['doctor_id'])) {
        $doctor_id = intval($_GET['doctor_id']);
    } else {
        if (empty($_SESSION['uid'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Not authenticated']);
            exit;
        }
        $user_id = (int)$_SESSION['uid'];

        $conn = getDBConnection();
        $rows = executeQuery($conn, 'SELECT s.staff_id FROM staff s JOIN user_account ua ON ua.email = s.email WHERE ua.user_id = ? LIMIT 1', 'i', [$user_id]);
        if (empty($rows)) {
            closeDBConnection($conn);
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'No doctor associated with this user']);
            exit;
        }
        $doctor_id = (int)$rows[0]['doctor_id'];
    }
    
    $conn = $conn ?? getDBConnection();
    
    // SQL query for doctor info (all lowercase)
    $sql = "SELECT 
                st.staff_id,
                st.first_name,
                st.last_name,
                st.email,
                st.phone,
                st.license_number,
                st.specialty_name,
                cg.gender_text as gender
            FROM staff st
            LEFT JOIN doctor d ON st.staff_id = d.doctor_id
            LEFT JOIN specialty s ON d.specialty = s.specialty_id
            LEFT JOIN codes_gender cg ON d.gender = cg.gender_code
            WHERE s.staff_id = ?";

    $result = executeQuery($conn, $sql, 'i', [$doctor_id]);
    
    if (empty($result)) {
        throw new Exception('Doctor not found');
    }
    
    $doctor = $result[0];
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'profile' => [
            'firstName' => $doctor['first_name'],  // ← Fixed: lowercase from query
            'lastName' => $doctor['last_name'],     // ← Fixed: lowercase
            'email' => $doctor['email'],
            'phone' => $doctor['phone'] ?: 'Not provided',
            'licenseNumber' => $doctor['license_number'],  // ← Fixed: lowercase
            'specialties' => [$doctor['specialty_name']],
            'gender' => $doctor['gender'],
            'bio' => ''
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>