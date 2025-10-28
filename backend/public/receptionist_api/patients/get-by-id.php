<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/patients/get-by-id.php
 * ==========================================
 * Get detailed patient information by ID
 */
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    $patientId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if ($patientId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid patient id required']);
        exit;
    }

    $conn = getDBConnection();
    
    // Get patient basic info
    $sql = "SELECT p.Patient_ID, p.First_Name, p.Last_Name, p.dob,
                   p.Email, p.EmergencyContact, p.InsuranceID
            FROM Patient p
            WHERE p.Patient_ID = ?";
    
    $patientRows = executeQuery($conn, $sql, 'i', [$patientId]);
    
    if (empty($patientRows)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Patient not found']);
        exit;
    }
    
    $patient = $patientRows[0];
    
    // Get insurance info
    $insSql = "SELECT pi.id, pi.copay, pi.deductible_individ, pi.coinsurance_rate_pct,
                      ip.plan_name, ip.plan_type,
                      py.NAME as payer_name
               FROM patient_insurance pi
               JOIN insurance_plan ip ON pi.plan_id = ip.plan_id
               JOIN insurance_payer py ON ip.payer_id = py.payer_id
               WHERE pi.id = ? AND pi.is_primary = 1";
    
    $insurance = null;
    if ($patient['InsuranceID']) {
        $insRows = executeQuery($conn, $insSql, 'i', [$patient['InsuranceID']]);
        $insurance = !empty($insRows) ? $insRows[0] : null;
    }
    
    // Get recent appointments
    $apptSql = "SELECT a.Appointment_id, a.Appointment_date, a.Reason_for_visit,
                       d.First_Name as Doctor_First, d.Last_Name as Doctor_Last,
                       pv.Status
                FROM Appointment a
                JOIN Doctor d ON a.Doctor_id = d.Doctor_id
                LEFT JOIN PatientVisit pv ON a.Appointment_id = pv.Appointment_id
                WHERE a.Patient_id = ?
                ORDER BY a.Appointment_date DESC
                LIMIT 5";
    
    $appointments = executeQuery($conn, $apptSql, 'i', [$patientId]);
    
    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'patient' => $patient,
        'insurance' => $insurance,
        'recent_appointments' => $appointments
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
