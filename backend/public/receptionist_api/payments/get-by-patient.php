<?php
/**
 * Get payment history for a specific patient
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
    
    if (!isset($_GET['patient_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'patient_id parameter is required']);
        exit;
    }
    
    $patient_id = (int)$_GET['patient_id'];
    $user_id = (int)$_SESSION['uid'];
    
    $conn = getDBConnection();
    
    // Verify receptionist is authenticated (we won't restrict by office for payment history)
    try {
        $rows = executeQuery($conn, '
            SELECT s.Work_Location as office_id
            FROM Staff s
            JOIN user_account ua ON ua.email = s.Email
            WHERE ua.user_id = ?', 'i', [$user_id]);
    } catch (Exception $ex) {
        closeDBConnection($conn);
        throw $ex;
    }
    
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No receptionist account associated with the logged-in user']);
        exit;
    }
    
    // Get payment history
    $sql = "SELECT 
                p.Payment_id,
                p.Payment_amount,
                p.Payment_date,
                p.Payment_method,
                p.Transaction_id,
                p.Notes,
                a.Appointment_id,
                a.Appointment_date,
                CONCAT(d.First_Name, ' ', d.Last_Name) as doctor_name,
                o.Name as office_name
            FROM Payment p
            INNER JOIN Appointment a ON p.Appointment_id = a.Appointment_id
            INNER JOIN Doctor d ON a.Doctor_id = d.Doctor_id
            LEFT JOIN Office o ON a.Office_id = o.Office_ID
            WHERE p.Patient_id = ?
            ORDER BY p.Payment_date DESC";
    
    $payments = executeQuery($conn, $sql, 'i', [$patient_id]);
    
    $formatted_payments = [];
    $total_paid = 0;
    
    foreach ($payments as $payment) {
        $total_paid += $payment['Payment_amount'];
        
        $formatted_payments[] = [
            'payment_id' => $payment['Payment_id'],
            'amount' => number_format($payment['Payment_amount'], 2),
            'payment_date' => date('Y-m-d', strtotime($payment['Payment_date'])),
            'payment_time' => date('g:i A', strtotime($payment['Payment_date'])),
            'payment_method' => $payment['Payment_method'],
            'transaction_id' => $payment['Transaction_id'],
            'notes' => $payment['Notes'],
            'appointment_id' => $payment['Appointment_id'],
            'appointmentIdFormatted' => 'A' . str_pad($payment['Appointment_id'], 4, '0', STR_PAD_LEFT),
            'appointment_date' => date('Y-m-d', strtotime($payment['Appointment_date'])),
            'doctor_name' => $payment['doctor_name'],
            'office_name' => $payment['office_name']
        ];
    }
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'payments' => $formatted_payments,
        'count' => count($formatted_payments),
        'total_paid' => number_format($total_paid, 2),
        'patient_id' => $patient_id
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>