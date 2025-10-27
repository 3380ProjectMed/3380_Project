<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/appointments/get-by-date.php
 * ==========================================
 * Get appointments for a specific date and office
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
    
    $sql = "SELECT a.Appointment_id, a.Patient_id, a.Doctor_id,
                   a.Appointment_date, a.Reason_for_visit,
                   p.First_Name as Patient_First, p.Last_Name as Patient_Last,
                   p.EmergencyContact,
                   d.First_Name as Doctor_First, d.Last_Name as Doctor_Last,
                   s.specialty_name,
                   pv.Status,
                   pi.copay
            FROM Appointment a
            JOIN Patient p ON a.Patient_id = p.Patient_ID
            JOIN Doctor d ON a.Doctor_id = d.Doctor_id
            LEFT JOIN Specialty s ON d.Specialty_id = s.Specialty_id
            LEFT JOIN PatientVisit pv ON a.Appointment_id = pv.Appointment_id
            LEFT JOIN patient_insurance pi ON p.InsuranceID = pi.id AND pi.is_primary = 1
            WHERE DATE(a.Appointment_date) = ? AND a.Office_id = ?
            ORDER BY a.Appointment_date ASC";
    
    $rows = executeQuery($conn, $sql, 'si', [$date, $officeId]);
    closeDBConnection($conn);

    echo json_encode(['success' => true, 'appointments' => $rows, 'count' => count($rows)]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
