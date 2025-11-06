<?php
/**
 * Check in a patient for their appointment
 * Uses session-based authentication like doctor API
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    // Start session and require that the user is logged in
    session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['Appointment_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Appointment_id is required']);
        exit;
    }
    
    $appointment_id = (int)$input['Appointment_id'];
    $user_id = (int)$_SESSION['uid'];
    
    $conn = getDBConnection();
    
    // Verify receptionist has access to this appointment's office
    $verifySql = "SELECT a.Appointment_id, a.Office_id, s.Work_Location
                  FROM Appointment a
                  JOIN Staff s ON s.Work_Location = a.Office_id
                  JOIN user_account ua ON ua.email = s.Staff_Email
                  WHERE a.Appointment_id = ? AND ua.user_id = ?";
    
    $verifyResult = executeQuery($conn, $verifySql, 'ii', [$appointment_id, $user_id]);
    
    if (empty($verifyResult)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied or appointment not found']);
        exit;
    }
    
    $conn->begin_transaction();
    
    try {
        // Check if PatientVisit record exists
        $checkVisitSql = "SELECT Visit_id FROM PatientVisit WHERE Appointment_id = ?";
        $existingVisit = executeQuery($conn, $checkVisitSql, 'i', [$appointment_id]);
        
        if (empty($existingVisit)) {
            // Create new PatientVisit record
            $insertVisitSql = "INSERT INTO PatientVisit (Appointment_id, Patient_id, Doctor_id, Office_id, Start_at, Status)
                              SELECT a.Appointment_id, a.Patient_id, a.Doctor_id, a.Office_id, NOW(), 'Scheduled'
                              FROM Appointment a WHERE a.Appointment_id = ?";
            executeQuery($conn, $insertVisitSql, 'i', [$appointment_id]);
        } else {
            // Update existing record
            $updateVisitSql = "UPDATE PatientVisit 
                              SET Start_at = NOW(), Status = 'Scheduled'
                              WHERE Appointment_id = ?";
            executeQuery($conn, $updateVisitSql, 'i', [$appointment_id]);
        }
        
        // Update appointment status if needed
        $updateApptSql = "UPDATE Appointment 
                         SET Status = 'Scheduled'
                         WHERE Appointment_id = ? AND Status NOT IN ('Completed', 'Cancelled')";
        executeQuery($conn, $updateApptSql, 'i', [$appointment_id]);
        
        $conn->commit();
        closeDBConnection($conn);
        
        echo json_encode([
            'success' => true,
            'message' => 'Patient checked in successfully',
            'check_in_time' => date('Y-m-d H:i:s')
        ]);
        
    } catch (Exception $ex) {
        $conn->rollback();
        closeDBConnection($conn);
        throw $ex;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>