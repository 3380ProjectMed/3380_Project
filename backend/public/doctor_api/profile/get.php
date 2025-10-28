<?php
/**
 * Get doctor profile
 * Matches YOUR database schema
 */

require_once '/home/site/wwwroot/cors.php';
require_once __DIR__ . '/../../../database.php';

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
        // Resolve doctor_id from user's email
        $rows = executeQuery($conn, 'SELECT d.Doctor_id FROM Doctor d JOIN user_account ua ON ua.email = d.Email WHERE ua.user_id = ? LIMIT 1', 'i', [$user_id]);
        if (empty($rows)) {
            closeDBConnection($conn);
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'No doctor associated with this user']);
            exit;
        }
        $doctor_id = (int)$rows[0]['Doctor_id'];
    }
    
    $conn = $conn ?? getDBConnection();
    
    // SQL query for doctor info
    $sql = "SELECT 
                d.Doctor_id,
                d.First_Name,
                d.Last_Name,
                d.Email,
                d.Phone,
                d.License_Number,
                s.specialty_name,
                cg.Gender_Text as gender
            FROM Doctor d
            LEFT JOIN Specialty s ON d.Specialty = s.specialty_id
            LEFT JOIN CodesGender cg ON d.Gender = cg.GenderCode
            WHERE d.Doctor_id = ?";
    
    $result = executeQuery($conn, $sql, 'i', [$doctor_id]);
    
    if (empty($result)) {
        throw new Exception('Doctor not found');
    }
    
    $doctor = $result[0];
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'profile' => [
            'firstName' => $doctor['First_Name'],
            'lastName' => $doctor['Last_Name'],
            'email' => $doctor['Email'],
            'phone' => $doctor['Phone'] ?: 'Not provided',
            'licenseNumber' => $doctor['License_Number'],
            'specialties' => [$doctor['specialty_name']],
            'gender' => $doctor['gender'],
            'bio' => '' // Add bio field to your database if needed
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