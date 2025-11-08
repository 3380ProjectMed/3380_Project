<?php
/**
 * Cancel an appointment
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
    $cancellation_reason = $input['cancellation_reason'] ?? 'No reason provided';
    $user_id = (int)$_SESSION['uid'];
    
    $conn = getDBConnection();
    
    // Verify receptionist has access to this appointment's office
    $verifySql = "SELECT a.Appointment_id, a.Office_id, s.work_location
                  FROM appointment a
                  JOIN staff s ON s.work_location = a.Office_id
                  JOIN user_account ua ON ua.email = s.staff_email
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
        // Update appointment status to cancelled
        $updateApptSql = "UPDATE appointment 
                         SET Status = 'Cancelled'
                         WHERE Appointment_id = ?";
        executeQuery($conn, $updateApptSql, 'i', [$appointment_id]);
        
        // Update or create patient_visit record
        $checkVisitSql = "SELECT visit_id FROM patient_visit WHERE appointment_id = ?";
        $existingVisit = executeQuery($conn, $checkVisitSql, 'i', [$appointment_id]);
        
        if (empty($existingVisit)) {
            $insertVisitSql = "INSERT INTO patient_visit (appointment_id, patient_id, doctor_id, office_id, status)
                              SELECT a.Appointment_id, a.Patient_id, a.Doctor_id, a.Office_id, 'Canceled'
                              FROM appointment a WHERE a.Appointment_id = ?";
            executeQuery($conn, $insertVisitSql, 'i', [$appointment_id]);
        } else {
            $updateVisitSql = "UPDATE patient_visit 
                              SET status = 'Canceled'
                              WHERE appointment_id = ?";
            executeQuery($conn, $updateVisitSql, 'i', [$appointment_id]);
        }
        
        $conn->commit();
        closeDBConnection($conn);
        
        echo json_encode([
            'success' => true,
            'message' => 'Appointment cancelled successfully',
            'cancellation_reason' => $cancellation_reason
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