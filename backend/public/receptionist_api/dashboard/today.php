<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/dashboard/today.php
 * ==========================================
 * Get today's appointments summary
 */
require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../database.php';

try {
    $officeId = isset($_GET['office_id']) ? (int)$_GET['office_id'] : 0;
    
    if ($officeId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid office_id required']);
        exit;
    }

    $conn = getDBConnection();
    $today = date('Y-m-d');
    
    $sql = "SELECT a.Appointment_id, a.Appointment_date, a.Reason_for_visit,
                   p.First_Name as Patient_First, p.Last_Name as Patient_Last,
                   p.EmergencyContact, p.Patient_ID,
                   d.First_Name as Doctor_First, d.Last_Name as Doctor_Last,
                   pv.Status, pv.Check_in_time,
                   pi.copay
            FROM Appointment a
            JOIN Patient p ON a.Patient_id = p.Patient_ID
            JOIN Doctor d ON a.Doctor_id = d.Doctor_id
            LEFT JOIN PatientVisit pv ON a.Appointment_id = pv.Appointment_id
            LEFT JOIN patient_insurance pi ON p.InsuranceID = pi.id AND pi.is_primary = 1
            WHERE a.Office_id = ? AND DATE(a.Appointment_date) = ?
            ORDER BY a.Appointment_date ASC";
    
    $rows = executeQuery($conn, $sql, 'is', [$officeId, $today]);
    closeDBConnection($conn);

    echo json_encode(['success' => true, 'appointments' => $rows, 'count' => count($rows)]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
