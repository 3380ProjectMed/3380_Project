<?php
/**
 * Record a payment
 * Uses session-based authentication like doctor API
 */
require_once __DIR__ . '/home/site/wwwroot/cors.php';
require_once __DIR__ . '/home/site/wwwroot/database.php';

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
    $verifySql = "SELECT a.Appointment_id, a.Office_id, s.work_location, s.staff_email
                  FROM appointment a
                  JOIN staff s ON s.work_location = a.Office_id
                  JOIN user_account ua ON ua.email = s.staff_email
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
        // Update patient_visit with payment information
        $updateVisitSql = "UPDATE patient_visit
                          SET status = 'Completed',
                              payment = ?,
                              copayamount_due = ?,
                              amount_due = ?,
                              total_due = ? - ?,
                              updatedby = ?
                          WHERE appointment_id = ?";
        
        $amount_due = $input['copay_amount'];
        $payment = $input['payment_received'];
        $staff_email = $verifyResult[0]['Staff_Email'];
        
        executeQuery($conn, $updateVisitSql, 'ddddisi', [
            $payment,
            $input['copay_amount'],
            $amount_due,
            $amount_due,
            $payment,
            $staff_email,
            $input['appointment_id']
        ]);

        // Get the Visit_id for the updated record
        $getVisitSql = "SELECT Visit_id FROM PatientVisit WHERE Appointment_id = ?";
        $visitResult = executeQuery($conn, $getVisitSql, 'i', [$input['appointment_id']]);
        
        $conn->commit();
        closeDBConnection($conn);
        
        echo json_encode([
            'success' => true,
            'message' => 'Payment recorded successfully',
            'payment_id' => $visitResult[0]['Visit_id'],
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