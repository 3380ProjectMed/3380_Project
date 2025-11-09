<?php
/**
 * Get doctor profile
 * Updated for new table structure
 */

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    session_start();
    
    $conn = getDBConnection();
    
    if (isset($_GET['doctor_id'])) {
        $doctor_id = intval($_GET['doctor_id']);
    } else {
        // Verify authentication and role
        if (empty($_SESSION['uid']) || empty($_SESSION['role'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Not authenticated']);
            exit;
        }
        
        if ($_SESSION['role'] !== 'DOCTOR') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Doctor access required']);
            exit;
        }
        
        // user_id = staff_id for doctors
        $staff_id = (int)$_SESSION['uid'];
        
        // Get doctor_id from staff_id
        $rows = executeQuery($conn, 
            'SELECT doctor_id FROM doctor WHERE staff_id = ? LIMIT 1', 
            'i', 
            [$staff_id]
        );
        
        if (empty($rows)) {
            closeDBConnection($conn);
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'No doctor record found for this user']);
            exit;
        }
        
        $doctor_id = (int)$rows[0]['doctor_id'];
    }
    
    // SQL query for doctor info
    $sql = "SELECT 
                d.doctor_id,
                d.staff_id,
                s.first_name,
                s.last_name,
                s.staff_email,
                s.license_number,
                s.work_location,
                o.name as work_location_name,
                sp.specialty_name,
                cg.gender_text as gender
            FROM doctor d
            INNER JOIN staff s ON d.staff_id = s.staff_id
            LEFT JOIN specialty sp ON d.specialty = sp.specialty_id
            LEFT JOIN codes_gender cg ON s.gender = cg.gender_code
            LEFT JOIN office o ON s.work_location = o.office_id
            WHERE d.doctor_id = ?";

    $result = executeQuery($conn, $sql, 'i', [$doctor_id]);
    
    if (empty($result)) {
        throw new Exception('Doctor not found');
    }
    
    $doctor = $result[0];
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'profile' => [
            'doctorId' => $doctor['doctor_id'],
            'staffId' => $doctor['staff_id'],
            'firstName' => $doctor['first_name'],
            'lastName' => $doctor['last_name'],
            'email' => $doctor['staff_email'],
            'licenseNumber' => $doctor['license_number'] ?: 'Not provided',
            'workLocation' => $doctor['work_location_name'] ?: 'Not assigned',
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