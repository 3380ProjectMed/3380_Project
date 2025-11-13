<?php
/**
 * Check in a patient for their appointment
 * Enhanced with insurance validation trigger support
 * Uses session-based authentication like doctor API
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
    
    if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['Appointment_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Appointment_id is required']);
        exit;
    }
    
    $appointment_id = (int)$input['Appointment_id'];
    $user_id = (int)$_SESSION['uid'];
    
    // Optional: allow forcing check-in despite warnings (not errors)
    $force_checkin = isset($input['force']) && $input['force'] === true;
    
    $conn = getDBConnection();
    
    // Verify receptionist has access to this appointment (same office)
    $verifySql = "SELECT a.Appointment_id, a.Office_id, a.Patient_id
                  FROM appointment a
                  JOIN user_account ua ON ua.user_id = ?
                  JOIN staff s ON ua.email = s.staff_email
                  JOIN work_schedule ws ON ws.staff_id = s.staff_id AND ws.office_id = a.Office_id
                  WHERE a.Appointment_id = ?";
    
    $verifyResult = executeQuery($conn, $verifySql, 'ii', [$user_id, $appointment_id]);
    
    if (empty($verifyResult)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied or appointment not found']);
        exit;
    }
    
    $patient_id = $verifyResult[0]['Patient_id'];
    
    $conn->begin_transaction();
    
    try {
        // Clear any previous insurance warning
        $conn->query("SET @insurance_warning = NULL");
        
        // Check if patient_visit record exists
        $checkVisitSql = "SELECT visit_id FROM patient_visit WHERE appointment_id = ?";
        $existingVisit = executeQuery($conn, $checkVisitSql, 'i', [$appointment_id]);
        
        if (empty($existingVisit)) {
            // Create new patient_visit record
            // The trigger will validate insurance automatically
            $insertVisitSql = "INSERT INTO patient_visit (appointment_id, patient_id, doctor_id, office_id, start_at, status)
                              SELECT a.Appointment_id, a.Patient_id, a.Doctor_id, a.Office_id, NOW(), 'Checked In'
                              FROM appointment a WHERE a.Appointment_id = ?";
            
            try {
                executeQuery($conn, $insertVisitSql, 'i', [$appointment_id]);
            } catch (Exception $insertEx) {
                // Check if this is an insurance-related error from the trigger
                $errorMsg = $insertEx->getMessage();
                $mysqlError = $conn->errno;
                
                // Parse insurance errors from trigger
                if ($mysqlError === 1644) { // SIGNAL SQLSTATE error
                    // Check for specific insurance error codes
                    if (strpos($errorMsg, 'INSURANCE_WARNING') !== false) {
                        // Error code 9001: No insurance found
                        $conn->rollback();
                        closeDBConnection($conn);
                        http_response_code(422); // Unprocessable Entity
                        echo json_encode([
                            'success' => false,
                            'error_type' => 'INSURANCE_WARNING',
                            'error_code' => 'NO_INSURANCE',
                            'error' => 'Patient has no active insurance on file',
                            'message' => 'Patient has no active insurance on file. Please verify insurance information before proceeding with check-in.',
                            'patient_id' => $patient_id,
                            'requires_update' => true
                        ]);
                        exit;
                    } elseif (strpos($errorMsg, 'INSURANCE_EXPIRED') !== false) {
                        // Error code 9002: Insurance expired
                        $conn->rollback();
                        closeDBConnection($conn);
                        http_response_code(422); // Unprocessable Entity
                        echo json_encode([
                            'success' => false,
                            'error_type' => 'INSURANCE_EXPIRED',
                            'error_code' => 'EXPIRED_INSURANCE',
                            'error' => 'Patient insurance has expired',
                            'message' => 'Patient insurance has expired. Please update insurance information before check-in.',
                            'patient_id' => $patient_id,
                            'requires_update' => true
                        ]);
                        exit;
                    }
                }
                
                // If it's not an insurance error, re-throw
                throw $insertEx;
            }
        } else {
            // Update existing record
            // Note: The trigger only fires on INSERT, not UPDATE
            // So we need to manually check insurance for updates
            $updateVisitSql = "UPDATE patient_visit 
                              SET start_at = NOW(), status = 'Checked In'
                              WHERE appointment_id = ?";
            executeQuery($conn, $updateVisitSql, 'i', [$appointment_id]);
        }
        
        // Check for insurance warnings (expiring soon)
        $warningResult = $conn->query("SELECT @insurance_warning AS warning");
        $warningRow = $warningResult->fetch_assoc();
        $insuranceWarning = $warningRow['warning'] ?? null;
        
        // Update appointment status to Checked-in
        $updateApptSql = "UPDATE appointment 
                         SET Status = 'Checked-in'
                         WHERE Appointment_id = ? AND Status NOT IN ('Completed', 'Cancelled', 'No-Show')";
        executeQuery($conn, $updateApptSql, 'i', [$appointment_id]);
        
        $conn->commit();
        closeDBConnection($conn);
        
        // Prepare response
        $response = [
            'success' => true,
            'message' => 'Patient checked in successfully',
            'check_in_time' => date('Y-m-d H:i:s')
        ];
        
        // Add insurance warning if present
        if (!empty($insuranceWarning)) {
            $response['insurance_warning'] = $insuranceWarning;
            $response['warning_type'] = 'INSURANCE_EXPIRING_SOON';
            
            // Parse the warning message for structured data
            if (preg_match('/expire in (\d+) days/', $insuranceWarning, $matches)) {
                $response['days_until_expiry'] = (int)$matches[1];
            }
            if (preg_match('/on ([\d\/]+)/', $insuranceWarning, $matches)) {
                $response['expiry_date'] = $matches[1];
            }
            if (preg_match('/Plan: ([^(]+)/', $insuranceWarning, $matches)) {
                $response['plan_name'] = trim($matches[1]);
            }
            if (preg_match('/\(([^)]+)\)/', $insuranceWarning, $matches)) {
                $response['payer_name'] = trim($matches[1]);
            }
        }
        
        echo json_encode($response);
        
    } catch (Exception $ex) {
        $conn->rollback();
        closeDBConnection($conn);
        throw $ex;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>