<?php

/**
 * ==========================================
 * FILE: public/receptionist_api/patients/get-by-id.php
 * ==========================================
 * Get detailed patient information by ID
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $user_id = (int) $_SESSION['uid'];

    $patientId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if ($patientId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid patient id required']);
        exit;
    }

    $conn = getDBConnection();

    $sql = "SELECT p.patient_id, p.first_name, p.last_name, p.dob,
             p.email, p.emergency_contact_id, p.insurance_id, p.primary_doctor,
             pcp_staff.first_name as pcp_first_name, pcp_staff.last_name as pcp_last_name
         FROM patient p
         LEFT JOIN doctor pcp ON p.primary_doctor = pcp.doctor_id
         LEFT JOIN staff pcp_staff ON pcp.staff_id = pcp_staff.staff_id
         WHERE p.patient_id = ?";

    $patientRows = executeQuery($conn, $sql, 'i', [$patientId]);

    if (empty($patientRows)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Patient not found']);
        exit;
    }

    $patient = $patientRows[0];

    $insSql = "SELECT pi.id, pi.expiration_date, ip.copay, ip.deductible_individual, ip.coinsurance_rate,
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

    $apptSql = "SELECT a.Appointment_id, a.Appointment_date, a.Reason_for_visit, a.Status,
                       doc_staff.first_name as Doctor_First, doc_staff.last_name as Doctor_Last,
                       pv.status as visit_status
                FROM appointment a
                JOIN doctor d ON a.Doctor_id = d.doctor_id
                LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
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
