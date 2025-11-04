<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    $patient_id = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;
    $appointment_id = isset($_GET['appointment_id']) ? intval($_GET['appointment_id']) : 0;
    
    if ($patient_id === 0 && $appointment_id === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'patient_id or appointment_id is required']);
        exit;
    }
    
    session_start();
    if (!isset($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    $conn = getDBConnection();
    
    // If appointment_id provided, get patient_id
    if ($appointment_id) {
        // appointment has mixed case columns
        $apptSql = "SELECT Patient_id FROM appointment WHERE Appointment_id = ?";
        $apptRows = executeQuery($conn, $apptSql, 'i', [$appointment_id]);
        
        if (!empty($apptRows)) {
            $patient_id = $apptRows[0]['Patient_id'];
        }
    }
    
    // Get all visits for this patient
    // patient_visit and doctor are lowercase
    $sql = "SELECT 
                pv.visit_id,
                pv.appointment_id,
                pv.patient_id,
                pv.doctor_id,
                pv.date,
                pv.status,
                pv.diagnosis,
                pv.treatment,
                pv.reason_for_visit,
                pv.blood_pressure,
                pv.temperature,
                pv.department,
                pv.created_at,
                pv.created_by,
                d.first_name AS doctor_first,
                d.last_name AS doctor_last
            FROM patient_visit pv
            LEFT JOIN doctor d ON d.doctor_id = pv.doctor_id
            WHERE pv.patient_id = ?
            ORDER BY pv.date DESC
            LIMIT 50";
    
    $rows = executeQuery($conn, $sql, 'i', [$patient_id]);
    
    if (!is_array($rows)) $rows = [];
    
    $notes = array_map(function($r) {
        return [
            'id' => $r['visit_id'] ?? null,
            'visit_id' => $r['visit_id'] ?? null,
            'appointment_id' => $r['appointment_id'] ?? null,
            'patient_id' => $r['patient_id'] ?? null,
            'doctor_id' => $r['doctor_id'] ?? null,
            'doctor_name' => trim((($r['doctor_first'] ?? '') . ' ' . ($r['doctor_last'] ?? ''))),
            'date' => $r['date'] ?? null,
            'visit_date' => $r['date'] ?? null,
            'status' => $r['status'] ?? null,
            'diagnosis' => $r['diagnosis'] ?? null,
            'treatment' => $r['treatment'] ?? null,
            'note_text' => $r['treatment'] ?? null,
            'reason' => $r['reason_for_visit'] ?? null,
            'blood_pressure' => $r['blood_pressure'] ?? null,
            'temperature' => $r['temperature'] ?? null,
            'department' => $r['department'] ?? null,
            'created_at' => $r['created_at'] ?? null,
            'created_by' => $r['created_by'] ?? null,
        ];
    }, $rows);
    
    closeDBConnection($conn);
    echo json_encode(['success' => true, 'notes' => $notes]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>