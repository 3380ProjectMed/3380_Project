<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/payments/get-by-patient.php
 * ==========================================
 * Get payment history for a patient
 */
require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../database.php';

try {
    $patientId = isset($_GET['patient_id']) ? (int)$_GET['patient_id'] : 0;
    
    if ($patientId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid patient_id required']);
        exit;
    }

    $conn = getDBConnection();
    
    $sql = "SELECT p.Payment_id, p.Appointment_id, p.Payment_amount,
                   p.Payment_date, p.Payment_method, p.Transaction_id, p.Notes,
                   a.Appointment_date, a.Reason_for_visit,
                   d.First_Name as Doctor_First, d.Last_Name as Doctor_Last
            FROM Payment p
            JOIN Appointment a ON p.Appointment_id = a.Appointment_id
            JOIN Doctor d ON a.Doctor_id = d.Doctor_id
            WHERE p.Patient_id = ?
            ORDER BY p.Payment_date DESC";
    
    $rows = executeQuery($conn, $sql, 'i', [$patientId]);
    closeDBConnection($conn);

    $payments = array_map(function($r) {
        return [
            'Payment_id' => (int)$r['Payment_id'],
            'Appointment_id' => (int)$r['Appointment_id'],
            'Payment_amount' => (float)$r['Payment_amount'],
            'Payment_date' => $r['Payment_date'],
            'Payment_method' => $r['Payment_method'],
            'Transaction_id' => $r['Transaction_id'],
            'Notes' => $r['Notes'],
            'Appointment_date' => $r['Appointment_date'],
            'Reason_for_visit' => $r['Reason_for_visit'],
            'Doctor_name' => $r['Doctor_First'] . ' ' . $r['Doctor_Last']
        ];
    }, $rows);

    echo json_encode(['success' => true, 'payments' => $payments, 'count' => count($payments)]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
