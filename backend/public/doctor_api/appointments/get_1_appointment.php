<?php
/**
 * Get single appointment by ID
 */

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    if (!isset($_GET['appointment_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'appointment_id required']);
        exit;
    }

    $appointment_id = intval($_GET['appointment_id']);
    
    $conn = getDBConnection();
    
    // appointment table has mixed case columns
    $sql = "SELECT 
                a.Appointment_id,
                a.Patient_id,
                a.Doctor_id,
                a.Office_id,
                a.Appointment_date,
                a.Reason_for_visit,
                a.Status,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name
            FROM appointment a
            LEFT JOIN patient p ON a.Patient_id = p.patient_id
            WHERE a.Appointment_id = ?";
    
    $result = executeQuery($conn, $sql, 'i', [$appointment_id]);
    
    if (empty($result)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Appointment not found']);
        closeDBConnection($conn);
        exit;
    }
    
    $appointment = $result[0];
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'appointment' => [
            'appointment_id' => (int)$appointment['Appointment_id'],
            'patient_id' => (int)$appointment['Patient_id'],
            'doctor_id' => (int)$appointment['Doctor_id'],
            'office_id' => (int)$appointment['Office_id'],
            'appointment_date' => $appointment['Appointment_date'],
            'reason' => $appointment['Reason_for_visit'],
            'Reason_for_visit' => $appointment['Reason_for_visit'],
            'status' => $appointment['Status'],
            'patient_name' => $appointment['patient_name']
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>