<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/payments/create.php
 * ==========================================
 * Record copayment
 */
require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../database.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    $required = ['appointment_id', 'patient_id', 'copay_amount', 'payment_received', 'transaction_id'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "$field is required"]);
            exit;
        }
    }

    $conn = getDBConnection();
    $conn->begin_transaction();
    
    // Insert payment record
    $sql = "INSERT INTO Payment (
                Appointment_id, Patient_id, Payment_amount, 
                Payment_date, Payment_method, Transaction_id, Notes
            ) VALUES (?, ?, ?, NOW(), ?, ?, ?)";
    
    $paymentMethod = $input['payment_method'] ?? 'cash';
    $notes = $input['notes'] ?? '';
    
    executeQuery($conn, $sql, 'iidsss', [
        $input['appointment_id'],
        $input['patient_id'],
        $input['payment_received'],
        $paymentMethod,
        $input['transaction_id'],
        $notes
    ]);
    
    // Update PatientVisit to mark payment as recorded
    $updateSql = "UPDATE PatientVisit 
                  SET Status = 'Completed' 
                  WHERE Appointment_id = ?";
    executeQuery($conn, $updateSql, 'i', [$input['appointment_id']]);
    
    $conn->commit();
    closeDBConnection($conn);

    echo json_encode([
        'success' => true, 
        'message' => 'Payment recorded successfully',
        'transaction_id' => $input['transaction_id']
    ]);

} catch (Exception $e) {
    if (isset($conn)) $conn->rollback();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
