<?php
/**
 * Get payments for a specific date at receptionist's office
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
    
    if (!isset($_GET['date'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'date parameter is required']);
        exit;
    }
    
    $date = $_GET['date'];
    $user_id = (int)$_SESSION['uid'];
    
    // Resolve the receptionist's office ID
    $conn = getDBConnection();
    
    try {
        $rows = executeQuery($conn, '
            SELECT s.Work_Location as office_id
            FROM Staff s
            JOIN user_account ua ON ua.email = s.Staff_Email
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
    
    $office_id = (int)$rows[0]['office_id'];
    
    // Get payments for this office on the specified date
    $sql = "SELECT 
                p.Payment_id,
                p.Payment_amount,
                p.Payment_date,
                p.Payment_method,
                p.Transaction_id,
                p.Notes,
                p.Patient_id,
                CONCAT(pat.First_Name, ' ', pat.Last_Name) as patient_name,
                a.Appointment_id,
                a.Appointment_date,
                CONCAT(d.First_Name, ' ', d.Last_Name) as doctor_name
            FROM Payment p
            INNER JOIN Appointment a ON p.Appointment_id = a.Appointment_id
            INNER JOIN Patient pat ON p.Patient_id = pat.Patient_ID
            INNER JOIN Doctor d ON a.Doctor_id = d.Doctor_id
            WHERE a.Office_id = ?
            AND DATE(p.Payment_date) = ?
            ORDER BY p.Payment_date DESC";
    
    $payments = executeQuery($conn, $sql, 'is', [$office_id, $date]);
    
    $formatted_payments = [];
    $totals = [
        'cash' => 0,
        'card' => 0,
        'check' => 0,
        'insurance' => 0,
        'other' => 0,
        'total' => 0
    ];
    
    foreach ($payments as $payment) {
        $amount = $payment['Payment_amount'];
        $method = strtolower($payment['Payment_method']);
        
        // Add to method-specific total
        if (isset($totals[$method])) {
            $totals[$method] += $amount;
        } else {
            $totals['other'] += $amount;
        }
        $totals['total'] += $amount;
        
        $formatted_payments[] = [
            'payment_id' => $payment['Payment_id'],
            'amount' => number_format($amount, 2),
            'payment_date' => date('Y-m-d', strtotime($payment['Payment_date'])),
            'payment_time' => date('g:i A', strtotime($payment['Payment_date'])),
            'payment_method' => $payment['Payment_method'],
            'transaction_id' => $payment['Transaction_id'],
            'notes' => $payment['Notes'],
            'patient_id' => $payment['Patient_id'],
            'patientIdFormatted' => 'P' . str_pad($payment['Patient_id'], 3, '0', STR_PAD_LEFT),
            'patient_name' => $payment['patient_name'],
            'appointment_id' => $payment['Appointment_id'],
            'appointmentIdFormatted' => 'A' . str_pad($payment['Appointment_id'], 4, '0', STR_PAD_LEFT),
            'appointment_date' => date('g:i A', strtotime($payment['Appointment_date'])),
            'doctor_name' => $payment['doctor_name']
        ];
    }
    
    // Format totals
    foreach ($totals as $key => $value) {
        $totals[$key] = number_format($value, 2);
    }
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'payments' => $formatted_payments,
        'count' => count($formatted_payments),
        'totals' => $totals,
        'date' => $date,
        'office_id' => $office_id
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>