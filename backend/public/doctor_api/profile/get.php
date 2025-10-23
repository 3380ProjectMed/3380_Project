<?php
/**
 * Get doctor profile
 * Matches YOUR database schema
 */

require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    $conn = getDBConnection();
    
    // Get doctor_id from query parameter
    $doctor_id = isset($_GET['doctor_id']) ? intval($_GET['doctor_id']) : 201;
    
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