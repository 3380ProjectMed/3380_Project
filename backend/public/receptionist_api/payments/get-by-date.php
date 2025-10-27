<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/payments/get-by-date.php
 * ==========================================
 * Get payments for a specific date and office
 */
require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../database.php';

try {
    $date = isset($_GET['date']) ? $_GET['date'] : '';
    $officeId = isset($_GET['office_id']) ? (int)$_GET['office_id'] : 0;
    
    if (empty($date) || $officeId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'date and office_id required']);
        exit;
    }

    $conn = getDBConnection();
    
    $sql = "SELECT p.Payment_id, p.Payment_amount, p.Payment_date,
                   p.Payment_method, p.Transaction_id,
                   pat.First_Name as Patient_First, pat.Last_Name as Patient_Last,
                   a.Reason_for_visit
            FROM Payment p
            JOIN Appointment a ON p.Appointment_id = a.Appointment_id
            JOIN Patient pat ON p.Patient_id = pat.Patient_ID
            WHERE DATE(p.Payment_date) = ? AND a.Office_id = ?
            ORDER BY p.Payment_date DESC";
    
    $rows = executeQuery($conn, $sql, 'si', [$date, $officeId]);
    closeDBConnection($conn);

    $total = array_sum(array_column($rows, 'Payment_amount'));

    echo json_encode([
        'success' => true, 
        'payments' => $rows, 
        'count' => count($rows),
        'total_collected' => (float)$total
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
