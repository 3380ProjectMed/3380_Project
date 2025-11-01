<?php
/**
 * Get doctor profile
 * Matches YOUR database schema
 */

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    session_start();

    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    // Read staff_id from query params (admin specifies which staff to fetch)
    $staff_id = isset($_GET['staff_id']) ? intval($_GET['staff_id']) : 0;
    if ($staff_id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'staff_id is required']);
        exit;
    }

    // Open DB connection
    $conn = getDBConnection();

    // SQL query for staff info
    $sql = "SELECT 
                s.first_name, 
                s.last_name,
                s.staff_email as Email, 
                cg.gender_text as gender
            FROM staff s
            LEFT JOIN codes_gender cg ON s.gender = cg.gender_code
            WHERE s.staff_id = ?";

    $result = executeQuery($conn, $sql, 'i', [$staff_id]);

    if (empty($result)) {
        throw new Exception('Staff not found');
    }

    $staff = $result[0];
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'profile' => [
            'firstName' => $staff['First_Name'],
            'lastName' => $staff['Last_Name'],
            'email' => $staff['Email'],
            'gender' => $staff['gender'],
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