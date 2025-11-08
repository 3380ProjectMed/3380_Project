<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/patients/get-by-id.php
 * ==========================================
 * Get detailed patient information by ID
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    // Start session and require that the user is logged in
    session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    $user_id = (int)$_SESSION['uid'];
    
    $patientId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if ($patientId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid patient id required']);
        exit;
    }

    $conn = getDBConnection();
    
    // Get patient basic info
    $sql = "SELECT p.patient_id, p.first_name, p.last_name, p.dob,
                   p.email, p.emergency_contact_id, p.insurance_id
            FROM patient p
            WHERE p.patient_id = ?";
    
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
                      py.name as payer_name
               FROM patient_insurance pi
               JOIN insurance_plan ip ON pi.plan_id = ip.plan_id
               JOIN insurance_payer py ON ip.payer_id = py.payer_id
               WHERE pi.id = ? AND pi.is_primary = 1";
    
    $insurance = null;
    if ($patient['insurance_id']) {
        $insRows = executeQuery($conn, $insSql, 'i', [$patient['insurance_id']]);
        $insurance = !empty($insRows) ? $insRows[0] : null;
    }
    
    // Get recent appointments
    $apptSql = "SELECT a.Appointment_id, a.Appointment_date, a.Reason_for_visit,
                       d.first_name as Doctor_First, d.last_name as Doctor_Last,
                       pv.status
                FROM appointment a
                JOIN doctor d ON a.Doctor_id = d.doctor_id
                LEFT JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id
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