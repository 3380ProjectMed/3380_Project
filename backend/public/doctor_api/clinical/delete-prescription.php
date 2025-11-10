<?php
/**
 * Delete a prescription
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

header('Content-Type: application/json');

try {
    session_start();
    
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $user_id = (int)$_SESSION['uid'];
    
    // Verify user is a doctor
    $conn = getDBConnection();
    $rows = executeQuery($conn, '
        SELECT s.staff_id 
        FROM staff s
        JOIN user_account ua ON ua.email = s.staff_email
        WHERE ua.user_id = ?', 'i', [$user_id]);
    
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied - doctors only']);
        exit;
    }
    
    $doctor_id = (int)$rows[0]['doctor_id'];
    
    // Get prescription_id from request
    $input = json_decode(file_get_contents('php://input'), true);
    $prescription_id = isset($input['prescription_id']) ? intval($input['prescription_id']) : 0;
    
    if ($prescription_id === 0) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'prescription_id required']);
        exit;
    }
    
    // Delete prescription (only if this doctor created it)
    $sql = "DELETE FROM prescription WHERE prescription_id = ? AND doctor_id = ?";
    $result = executeQuery($conn, $sql, 'ii', [$prescription_id, $doctor_id]);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'message' => 'Prescription deleted successfully'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>