<?php

/**
 * Check in a patient for their appointment
 * Enhanced with insurance validation trigger support
 * Uses session-based authentication like doctor API
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    // Start session and require that the user is logged in
    //session_start();
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

    if (!isset($input['nurse_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'nurse_id is required']);
        exit;
    }

    $appointment_id = (int)$input['Appointment_id'];
    $nurse_id = (int)$input['nurse_id'];
    $user_id = (int)$_SESSION['uid'];
    
    // Check if this is validation-only mode
    $validate_only = isset($input['validate_only']) && $input['validate_only'] === true;

    // Optional: allow forcing check-in despite warnings (not errors)
    $force_checkin = isset($input['force']) && $input['force'] === true;

    // Optional validation token (generated during validate_only to acknowledge warnings)
    $validation_token = isset($input['validation_token']) ? $input['validation_token'] : null;
    $acknowledged_validation = false;

    $conn = getDBConnection();

    // Verify receptionist has access to this appointment (same office) and get patient details
    $verifySql = "SELECT a.Appointment_id, a.Office_id, a.Patient_id, a.Doctor_id,
                         p.first_name, p.last_name
                  FROM appointment a
                  JOIN patient p ON a.Patient_id = p.patient_id
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
    $office_id = $verifyResult[0]['Office_id'];
    $doctor_id = $verifyResult[0]['Doctor_id'];
    $patient_first = $verifyResult[0]['first_name'];
    $patient_last = $verifyResult[0]['last_name'];
    
    // If validate_only mode, attempt insert in a transaction and rollback
    // This lets the trigger do the validation work
    if ($validate_only) {
        $conn->begin_transaction();
        try {
            // Clear any previous insurance warning
            $conn->query("SET @insurance_warning = NULL");

            // If frontend supplied a validation token, check session to see if validation was acknowledged
            if (!empty($validation_token) && isset($_SESSION['checkin_validation'][$appointment_id])) {
                $stored = $_SESSION['checkin_validation'][$appointment_id];
                // token match and not older than 10 minutes
                if ($stored['token'] === $validation_token && (time() - ($stored['time'] ?? 0) <= 600)) {
                    $acknowledged_validation = true;
                    // once acknowledged, remove the stored token to prevent reuse
                    unset($_SESSION['checkin_validation'][$appointment_id]);
                }
            }
            
            // Attempt to insert - trigger will validate
            // Use NULL for nurse_id during validation-only to avoid foreign key errors (frontend may pass 0)
            $insertVisitSql = "INSERT INTO patient_visit (appointment_id, patient_id, doctor_id, nurse_id, office_id, start_at, insurance_policy_id_used)
                              VALUES (?, ?, ?, NULL, ?, NOW(), NULL)";
            // bind: appointment_id, patient_id, doctor_id, office_id
            executeQuery($conn, $insertVisitSql, 'iiii', [$appointment_id, $patient_id, $doctor_id, $office_id]);
            
            // Check for warnings from trigger
            $warningResult = $conn->query("SELECT @insurance_warning AS warning");
            $warningRow = $warningResult->fetch_assoc();
            $insuranceWarning = $warningRow['warning'] ?? null;
            
            // Rollback - we were just validating
            $conn->rollback();
            closeDBConnection($conn);
            
            // Return success with any warnings
            $response = [
                'success' => true,
                'message' => 'Insurance validation passed',
                'validation_only' => true
            ];
            
            if (!empty($insuranceWarning)) {
                // Generate a validation token so frontend can acknowledge this warning and suppress it
                // during the real check-in request.
                try {
                    $token = bin2hex(random_bytes(16));
                } catch (Exception $e) {
                    $token = uniqid('val_', true);
                }

                if (!isset($_SESSION['checkin_validation'])) {
                    $_SESSION['checkin_validation'] = [];
                }
                $_SESSION['checkin_validation'][$appointment_id] = [
                    'token' => $token,
                    'warning' => $insuranceWarning,
                    'time' => time()
                ];

                $response['insurance_warning'] = $insuranceWarning;
                $response['warning_type'] = 'INSURANCE_EXPIRING_SOON';
                $response['validation_token'] = $token;
            }
            
            echo json_encode($response);
            exit;
            
        } catch (Exception $validateEx) {
            // Trigger threw an error - parse it
            $conn->rollback();
            closeDBConnection($conn);
            
            $errorMsg = $validateEx->getMessage();
            $mysqlError = isset($validateEx->errorCode) ? $validateEx->errorCode : null;
            
            // Check if this is an insurance error from the trigger
            if ($mysqlError === 1644 || strpos($errorMsg, 'INSURANCE_WARNING') !== false || strpos($errorMsg, 'INSURANCE_EXPIRED') !== false) {
                if (strpos($errorMsg, 'INSURANCE_WARNING') !== false) {
                    http_response_code(422);
                    echo json_encode([
                        'success' => false,
                        'error_type' => 'INSURANCE_WARNING',
                        'error_code' => 'NO_INSURANCE',
                        'error' => 'Patient has no active insurance on file',
                        'message' => $errorMsg,
                        'patient' => [
                            'Patient_id' => $patient_id,
                            'Patient_First' => $patient_first,
                            'Patient_Last' => $patient_last
                        ],
                        'requires_update' => true,
                        'validation_only' => true
                    ]);
                    exit;
                } elseif (strpos($errorMsg, 'INSURANCE_EXPIRED') !== false) {
                    http_response_code(422);
                    echo json_encode([
                        'success' => false,
                        'error_type' => 'INSURANCE_EXPIRED',
                        'error_code' => 'EXPIRED_INSURANCE',
                        'error' => 'Patient insurance has expired',
                        'message' => $errorMsg,
                        'patient' => [
                            'Patient_id' => $patient_id,
                            'Patient_First' => $patient_first,
                            'Patient_Last' => $patient_last
                        ],
                        'requires_update' => true,
                        'validation_only' => true
                    ]);
                    exit;
                }
            }
            
            // Other error
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to validate insurance: ' . $errorMsg,
                'validation_only' => true
            ]);
            exit;
        }
    }

    $conn->begin_transaction();

    try {
        // Clear any previous insurance warning
        $conn->query("SET @insurance_warning = NULL");

        // If frontend supplied a validation token, check session to see if validation was acknowledged
        if (!empty($validation_token) && isset($_SESSION['checkin_validation'][$appointment_id])) {
            $stored = $_SESSION['checkin_validation'][$appointment_id];
            // token match and not older than 10 minutes
            if ($stored['token'] === $validation_token && (time() - ($stored['time'] ?? 0) <= 600)) {
                $acknowledged_validation = true;
                // once acknowledged, remove the stored token to prevent reuse
                unset($_SESSION['checkin_validation'][$appointment_id]);
            }
        }

        // Check if patient_visit record exists
        $checkVisitSql = "SELECT visit_id FROM patient_visit WHERE appointment_id = ?";
        $existingVisit = executeQuery($conn, $checkVisitSql, 'i', [$appointment_id]);

        if (empty($existingVisit)) {
            // Create new patient_visit record
            // The trigger will validate insurance automatically and populate insurance_policy_id_used
            $insertVisitSql = "INSERT INTO patient_visit (appointment_id, patient_id, doctor_id, nurse_id, office_id, start_at, insurance_policy_id_used)
                              VALUES (?, ?, ?, ?, ?, NOW(), NULL)";

            try {
                // Ensure nurse_id is valid before attempting insert to avoid FK constraint failures
                $nurseToUse = null;
                if ($nurse_id > 0) {
                    $nurseCheck = executeQuery($conn, 'SELECT nurse_id FROM nurse WHERE nurse_id = ? LIMIT 1', 'i', [$nurse_id]);
                    if (empty($nurseCheck)) {
                        // Invalid nurse_id provided
                        $conn->rollback();
                        closeDBConnection($conn);
                        http_response_code(400);
                        echo json_encode([
                            'success' => false,
                            'error' => 'Invalid nurse_id provided',
                            'nurse_id' => $nurse_id
                        ]);
                        exit;
                    }
                    $nurseToUse = $nurse_id;
                }

                // executeQuery will bind the nurse value; passing null will set NULL in statement
                executeQuery($conn, $insertVisitSql, 'iiiii', [$appointment_id, $patient_id, $doctor_id, $nurseToUse, $office_id]);

            } catch (Exception $insertEx) {
                // Trigger threw an error - parse it and return appropriate response
                $errorMsg = $insertEx->getMessage();
                $mysqlError = isset($insertEx->errorCode) ? $insertEx->errorCode : null;

                // Check if this is an insurance error from the trigger (SIGNAL SQLSTATE '45000')
                if ($mysqlError === 1644 || strpos($errorMsg, 'INSURANCE_WARNING') !== false || strpos($errorMsg, 'INSURANCE_EXPIRED') !== false) {
                    $conn->rollback();
                    closeDBConnection($conn);
                    
                    if (strpos($errorMsg, 'INSURANCE_WARNING') !== false) {
                        // Trigger detected no insurance
                        http_response_code(422);
                        echo json_encode([
                            'success' => false,
                            'error_type' => 'INSURANCE_WARNING',
                            'error_code' => 'NO_INSURANCE',
                            'message' => $errorMsg, // Use trigger's message
                            'patient' => [
                                'Patient_id' => $patient_id,
                                'Patient_First' => $patient_first,
                                'Patient_Last' => $patient_last
                            ],
                            'requires_update' => true
                        ]);
                        exit;
                    } elseif (strpos($errorMsg, 'INSURANCE_EXPIRED') !== false) {
                        // Trigger detected expired insurance
                        http_response_code(422);
                        echo json_encode([
                            'success' => false,
                            'error_type' => 'INSURANCE_EXPIRED',
                            'error_code' => 'EXPIRED_INSURANCE',
                            'message' => $errorMsg, // Use trigger's message
                            'patient' => [
                                'Patient_id' => $patient_id,
                                'Patient_First' => $patient_first,
                                'Patient_Last' => $patient_last
                            ],
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
                              SET start_at = NOW()
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

        // Add insurance warning if present and not already acknowledged via validation token or force flag
        if (!empty($insuranceWarning) && !$acknowledged_validation && !$force_checkin) {
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
