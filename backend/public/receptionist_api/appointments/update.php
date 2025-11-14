<?php
/**
 * Update an existing appointment
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
    $verifySql = "SELECT a.Appointment_id, a.Office_id
                  FROM appointment a
                  JOIN user_account ua ON ua.user_id = ?
                  JOIN staff s ON ua.email = s.staff_email
                  JOIN work_schedule ws ON ws.staff_id = s.staff_id AND ws.office_id = a.Office_id
                  WHERE a.Appointment_id = ?";
    
    $verifyResult = executeQuery($conn, $verifySql, 'ii', [$user_id, $appointment_id]);
    
    if (empty($verifyResult)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied or appointment not found']);
        exit;
    }
    
    // Build dynamic update query based on provided fields
    $updateFields = [];
    $types = '';
    $values = [];
    
    if (isset($input['Appointment_date'])) {
        $updateFields[] = 'Appointment_date = ?';
        $types .= 's';
        $values[] = $input['Appointment_date'];
    }
    
    if (isset($input['Reason_for_visit'])) {
        $updateFields[] = 'Reason_for_visit = ?';
        $types .= 's';
        $values[] = $input['Reason_for_visit'];
    }
    
    if (isset($input['Doctor_id'])) {
        $updateFields[] = 'Doctor_id = ?';
        $types .= 'i';
        $values[] = $input['Doctor_id'];
    }
    
    if (isset($input['Status'])) {
        $validStatuses = ['Scheduled', 'Pending', 'Waiting', 'Checked-in', 'In Progress', 'Completed', 'Cancelled', 'No-Show'];
        if (in_array($input['Status'], $validStatuses)) {
            $updateFields[] = 'Status = ?';
            $types .= 's';
            $values[] = $input['Status'];
        }
    }
    
    if (empty($updateFields)) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No valid fields to update']);
        exit;
    }
    
    $conn->begin_transaction();
    
    try {
        // Add appointment_id to values
        $values[] = $appointment_id;
        $types .= 'i';
        
        $updateSql = "UPDATE appointment SET " . implode(', ', $updateFields) . " WHERE Appointment_id = ?";
        executeQuery($conn, $updateSql, $types, $values);
        
        $conn->commit();
        closeDBConnection($conn);
        
        echo json_encode([
            'success' => true,
            'message' => 'Appointment updated successfully',
            'appointment_id' => $appointment_id
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