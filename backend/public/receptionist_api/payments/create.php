<?php
/**
 * Record a payment
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
    $required = ['appointment_id', 'patient_id', 'copay_amount', 'payment_received', 'transaction_id'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "$field is required"]);
            exit;
        }
    }
    
    $user_id = (int)$_SESSION['uid'];
    
    $conn = getDBConnection();
    
    // Verify receptionist has access to this appointment's office
    $verifySql = "SELECT a.Appointment_id, a.Office_id, s.Work_Location
                  FROM Appointment a
                  JOIN Staff s ON s.Work_Location = a.Office_id
                  JOIN user_account ua ON ua.email = s.Email
                  WHERE a.Appointment_id = ? AND ua.user_id = ?";
    
    $verifyResult = executeQuery($conn, $verifySql, 'ii', [$input['appointment_id'], $user_id]);
    
    if (empty($verifyResult)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied or appointment not found']);
        exit;
    }
    
    $conn->begin_transaction();
    
    try {
        // Insert payment record
        $insertPaymentSql = "INSERT INTO Payment (
                                Appointment_id, 
                                Patient_id, 
                                Payment_amount, 
                                Payment_date, 
                                Payment_method, 
                                Transaction_id, 
                                Notes
                            ) VALUES (?, ?, ?, NOW(), ?, ?, ?)";
        
        $payment_method = $input['payment_method'] ?? 'cash';
        $notes = $input['notes'] ?? '';
        
        executeQuery($conn, $insertPaymentSql, 'iidsss', [
            $input['appointment_id'],
            $input['patient_id'],
            $input['payment_received'],
            $payment_method,
            $input['transaction_id'],
            $notes
        ]);
        
        $payment_id = $conn->insert_id;
        
        // Update PatientVisit to mark payment as recorded
        $updateVisitSql = "UPDATE PatientVisit 
                          SET Status = 'Completed' 
                          WHERE Appointment_id = ?";
        executeQuery($conn, $updateVisitSql, 'i', [$input['appointment_id']]);
        
        $conn->commit();
        closeDBConnection($conn);
        
        echo json_encode([
            'success' => true,
            'message' => 'Payment recorded successfully',
            'payment_id' => $payment_id,
            'transaction_id' => $input['transaction_id']
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