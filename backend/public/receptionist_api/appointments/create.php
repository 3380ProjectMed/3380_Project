<?php
/**
 * Create a new appointment
 * Uses session-based authentication like doctor API
 */
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    // Start session and require that the user is logged in
    session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required = ['Patient_id', 'Doctor_id', 'Appointment_date', 'Office_id'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "$field is required"]);
            exit;
        }
    }
    
    $user_id = (int)$_SESSION['uid'];
    
    $conn = getDBConnection();
    
    // Verify receptionist works at the specified office
    $verifySql = "SELECT s.Work_Location
                  FROM Staff s
                  JOIN user_account ua ON ua.email = s.Staff_Email
                  WHERE ua.user_id = ? AND s.Work_Location = ?";
    
    $verifyResult = executeQuery($conn, $verifySql, 'ii', [$user_id, $input['Office_id']]);
    
    if (empty($verifyResult)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied - you can only create appointments for your office']);
        exit;
    }
    
    // Verify doctor exists and works at this office
    $doctorSql = "SELECT Doctor_id FROM Doctor WHERE Doctor_id = ?";
    $doctorResult = executeQuery($conn, $doctorSql, 'i', [$input['Doctor_id']]);
    
    if (empty($doctorResult)) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid doctor ID']);
        exit;
    }
    
    // Verify patient exists
    $patientSql = "SELECT Patient_ID FROM Patient WHERE Patient_ID = ?";
    $patientResult = executeQuery($conn, $patientSql, 'i', [$input['Patient_id']]);
    
    if (empty($patientResult)) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid patient ID']);
        exit;
    }
    
    $conn->begin_transaction();
    
    try {
        // Insert appointment
        $insertSql = "INSERT INTO Appointment (
                        Patient_id, 
                        Doctor_id, 
                        Appointment_date, 
                        Reason_for_visit, 
                        Office_id,
                        Status
                      ) VALUES (?, ?, ?, ?, ?, 'Scheduled')";
        
        $reason = $input['Reason_for_visit'] ?? 'General Visit';
        
        executeQuery($conn, $insertSql, 'iissi', [
            $input['Patient_id'],
            $input['Doctor_id'],
            $input['Appointment_date'],
            $reason,
            $input['Office_id']
        ]);
        
        $appointment_id = $conn->insert_id;
        
        $conn->commit();
        closeDBConnection($conn);
        
        echo json_encode([
            'success' => true,
            'message' => 'Appointment created successfully',
            'appointment_id' => $appointment_id,
            'appointmentIdFormatted' => 'A' . str_pad($appointment_id, 4, '0', STR_PAD_LEFT)
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