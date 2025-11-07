<?php
/**
 * DEBUG VERSION - Get patient visit details
 * This version shows detailed errors to help diagnose the 500 error
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

header('Content-Type: application/json');

try {
    session_start();
    
    // Log what we received
    error_log("GET params: " . print_r($_GET, true));
    
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated', 'debug' => 'No session uid']);
        exit;
    }

    // Handle IDs
    $visit_id = isset($_GET['visit_id']) ? intval($_GET['visit_id']) : 0;
    
    $appointment_id_raw = isset($_GET['appointment_id']) ? trim($_GET['appointment_id']) : '';
    $appointment_id = 0;
    if (!empty($appointment_id_raw)) {
        $cleaned_id = $appointment_id_raw;
        if (strtoupper(substr($cleaned_id, 0, 1)) === 'A') {
            $cleaned_id = substr($cleaned_id, 1);
        }
        $appointment_id = intval($cleaned_id);
    }
    
    $patient_id = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;

    error_log("Processed IDs - visit: $visit_id, appointment: $appointment_id, patient: $patient_id");

    if ($visit_id === 0 && $appointment_id === 0 && $patient_id === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'visit_id, appointment_id, or patient_id required']);
        exit;
    }

    $conn = getDBConnection();
    error_log("Database connection established");

    if ($appointment_id > 0) {
        error_log("Looking for appointment_id: $appointment_id");
        
        // First check if appointment exists
        $checkSql = "SELECT Appointment_id FROM appointment WHERE Appointment_id = ?";
        $checkRows = executeQuery($conn, $checkSql, 'i', [$appointment_id]);
        
        if (empty($checkRows)) {
            closeDBConnection($conn);
            echo json_encode([
                'success' => false, 
                'error' => 'Appointment not found',
                'has_visit' => false,
                'debug' => [
                    'appointment_id' => $appointment_id,
                    'search_result' => 'No appointment found'
                ]
            ]);
            exit;
        }
        
        error_log("Appointment found, checking for patient_visit");
        
        // Try to find patient_visit
        $visitSql = "SELECT pv.visit_id FROM patient_visit pv WHERE pv.appointment_id = ? LIMIT 1";
        $visitRows = executeQuery($conn, $visitSql, 'i', [$appointment_id]);
        
        if (empty($visitRows)) {
            error_log("No patient_visit found, fetching appointment details");
            
            // Get appointment and patient data
            $apptSql = "SELECT 
                        a.Appointment_id,
                        a.Patient_id,
                        a.Appointment_date,
                        a.Doctor_id,
                        a.Reason_for_visit,
                        a.Office_id,
                        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                        p.dob,
                        p.blood_type
                    FROM appointment a
                    LEFT JOIN patient p ON a.Patient_id = p.patient_id
                    WHERE a.Appointment_id = ?";
            $apptRows = executeQuery($conn, $apptSql, 'i', [$appointment_id]);
            
            if (empty($apptRows)) {
                closeDBConnection($conn);
                echo json_encode([
                    'success' => false, 
                    'error' => 'Appointment data could not be loaded',
                    'debug' => 'Appointment exists but could not load details'
                ]);
                exit;
            }
            
            $appt = $apptRows[0];
            
            // Calculate age
            $age = null;
            if (!empty($appt['dob'])) {
                try {
                    $dob = new DateTime($appt['dob']);
                    $now = new DateTime();
                    $age = $now->diff($dob)->y;
                } catch (Exception $e) {
                    error_log("Age calculation error: " . $e->getMessage());
                }
            }
            
            $response = [
                'success' => true,
                'has_visit' => false,
                'debug' => 'No patient_visit found - showing appointment data',
                'patient' => [
                    'id' => $appt['Patient_id'],
                    'name' => $appt['patient_name'],
                    'dob' => $appt['dob'],
                    'age' => $age,
                    'blood_type' => $appt['blood_type']
                ],
                'visit' => [
                    'appointment_id' => $appt['Appointment_id'],
                    'patient_id' => $appt['Patient_id'],
                    'date' => $appt['Appointment_date'],
                    'reason' => $appt['Reason_for_visit']
                ]
            ];
            
            closeDBConnection($conn);
            echo json_encode($response);
            exit;
        }
        
        error_log("Patient visit found: " . $visitRows[0]['visit_id']);
    }
    
    // If we get here, either we have a visit_id or found a patient_visit
    echo json_encode([
        'success' => true,
        'debug' => 'Code reached this point',
        'params' => [
            'visit_id' => $visit_id,
            'appointment_id' => $appointment_id,
            'patient_id' => $patient_id
        ]
    ]);
    
    closeDBConnection($conn);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>