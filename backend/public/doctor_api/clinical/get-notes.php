<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    // Require patient_id (or appointment_id) as query param
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
    
    // If appointment_id provided, get that specific visit AND all other visits for that patient
    if ($appointment_id) {
        // First get the patient_id from the appointment
        $apptSql = "SELECT Patient_id FROM Appointment WHERE Appointment_id = ?";
        $apptRows = executeQuery($conn, $apptSql, 'i', [$appointment_id]);
        
        if (!empty($apptRows)) {
            $patient_id = $apptRows[0]['Patient_id'];
        }
    }
    
    // Now get all visits for this patient
    $sql = "SELECT 
                pv.Visit_id,
                pv.Appointment_id,
                pv.Patient_id,
                pv.Doctor_id,
                pv.Date,
                pv.Status,
                pv.Diagnosis,
                pv.Treatment,
                pv.Reason_for_Visit,
                pv.Blood_pressure,
                pv.Temperature,
                pv.Department,
                pv.CreatedAt,
                pv.CreatedBy,
                d.First_Name AS doctor_first,
                d.Last_Name AS doctor_last
            FROM PatientVisit pv
            LEFT JOIN Doctor d ON d.Doctor_id = pv.Doctor_id
            WHERE pv.Patient_id = ?
            ORDER BY pv.Date DESC
            LIMIT 50";
    
    $rows = executeQuery($conn, $sql, 'i', [$patient_id]);
    
    if (!is_array($rows)) $rows = [];
    
    // Normalize notes with all relevant fields
    $notes = array_map(function($r) {
        return [
            'id' => $r['Visit_id'] ?? null,
            'visit_id' => $r['Visit_id'] ?? null,
            'appointment_id' => $r['Appointment_id'] ?? null,
            'patient_id' => $r['Patient_id'] ?? null,
            'doctor_id' => $r['Doctor_id'] ?? null,
            'doctor_name' => trim((($r['doctor_first'] ?? '') . ' ' . ($r['doctor_last'] ?? ''))),
            'date' => $r['Date'] ?? null,
            'visit_date' => $r['Date'] ?? null,
            'status' => $r['Status'] ?? null,
            'diagnosis' => $r['Diagnosis'] ?? null,
            'treatment' => $r['Treatment'] ?? null,
            'note_text' => $r['Treatment'] ?? null,
            'reason' => $r['Reason_for_Visit'] ?? null,
            'blood_pressure' => $r['Blood_pressure'] ?? null,
            'temperature' => $r['Temperature'] ?? null,
            'department' => $r['Department'] ?? null,
            'created_at' => $r['CreatedAt'] ?? null,
            'created_by' => $r['CreatedBy'] ?? null,
        ];
    }, $rows);
    
    closeDBConnection($conn);
    echo json_encode(['success' => true, 'notes' => $notes]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>