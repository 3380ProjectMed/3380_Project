<?php

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {

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

    $validate_only = isset($input['validate_only']) && $input['validate_only'] === true;

    $force_checkin = isset($input['force']) && $input['force'] === true;

    $validation_token = isset($input['validation_token']) ? $input['validation_token'] : null;
    $acknowledged_validation = false;

    $conn = getDBConnection();

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

    $receptionist_email = $_SESSION['email'] ?? $_SESSION['username'] ?? null;

    if ($validate_only) {
        $conn->begin_transaction();
        try {

            $conn->query("SET @insurance_warning = NULL");

            if (!empty($validation_token) && isset($_SESSION['checkin_validation'][$appointment_id])) {
                $stored = $_SESSION['checkin_validation'][$appointment_id];

                if ($stored['token'] === $validation_token && (time() - ($stored['time'] ?? 0) <= 600)) {
                    $acknowledged_validation = true;

                    unset($_SESSION['checkin_validation'][$appointment_id]);
                }
            }

            $insertVisitSql = "INSERT INTO patient_visit (appointment_id, patient_id, doctor_id, nurse_id, office_id, start_at, insurance_policy_id_used, created_by, updated_by)
                              VALUES (?, ?, ?, NULL, ?, NOW(), NULL, ?, ?)";

            executeQuery($conn, $insertVisitSql, 'iiiiss', [$appointment_id, $patient_id, $doctor_id, $office_id, $receptionist_email, $receptionist_email]);

            $warningResult = $conn->query("SELECT @insurance_warning AS warning");
            $warningRow = $warningResult->fetch_assoc();
            $insuranceWarning = $warningRow['warning'] ?? null;

            $conn->rollback();
            closeDBConnection($conn);

            $response = [
                'success' => true,
                'message' => 'Insurance validation passed',
                'validation_only' => true
            ];

            if (!empty($insuranceWarning)) {

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

            $conn->rollback();
            closeDBConnection($conn);

            $errorMsg = $validateEx->getMessage();
            $mysqlError = isset($validateEx->errorCode) ? $validateEx->errorCode : null;

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

        $conn->query("SET @insurance_warning = NULL");

        if (!empty($validation_token) && isset($_SESSION['checkin_validation'][$appointment_id])) {
            $stored = $_SESSION['checkin_validation'][$appointment_id];

            if ($stored['token'] === $validation_token && (time() - ($stored['time'] ?? 0) <= 600)) {
                $acknowledged_validation = true;

                unset($_SESSION['checkin_validation'][$appointment_id]);
            }
        }

        $checkVisitSql = "SELECT visit_id FROM patient_visit WHERE appointment_id = ?";
        $existingVisit = executeQuery($conn, $checkVisitSql, 'i', [$appointment_id]);

        if (empty($existingVisit)) {

                $insertVisitSql = "INSERT INTO patient_visit (appointment_id, patient_id, doctor_id, nurse_id, office_id, start_at, insurance_policy_id_used, created_by, updated_by)
                              VALUES (?, ?, ?, ?, ?, NOW(), NULL, ?, ?)";

            try {

                $nurseToUse = null;
                if ($nurse_id > 0) {
                    $nurseCheck = executeQuery($conn, 'SELECT nurse_id FROM nurse WHERE nurse_id = ? LIMIT 1', 'i', [$nurse_id]);
                    if (empty($nurseCheck)) {

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

                executeQuery($conn, $insertVisitSql, 'iiiiss', [$appointment_id, $patient_id, $doctor_id, $nurseToUse, $office_id, $receptionist_email, $receptionist_email]);

            } catch (Exception $insertEx) {

                $errorMsg = $insertEx->getMessage();
                $mysqlError = isset($insertEx->errorCode) ? $insertEx->errorCode : null;

                if ($mysqlError === 1644 || strpos($errorMsg, 'INSURANCE_WARNING') !== false || strpos($errorMsg, 'INSURANCE_EXPIRED') !== false) {
                    $conn->rollback();
                    closeDBConnection($conn);

                    if (strpos($errorMsg, 'INSURANCE_WARNING') !== false) {

                        http_response_code(422);
                        echo json_encode([
                            'success' => false,
                            'error_type' => 'INSURANCE_WARNING',
                            'error_code' => 'NO_INSURANCE',
                            'message' => $errorMsg,
                            'patient' => [
                                'Patient_id' => $patient_id,
                                'Patient_First' => $patient_first,
                                'Patient_Last' => $patient_last
                            ],
                            'requires_update' => true
                        ]);
                        exit;
                    } elseif (strpos($errorMsg, 'INSURANCE_EXPIRED') !== false) {

                        http_response_code(422);
                        echo json_encode([
                            'success' => false,
                            'error_type' => 'INSURANCE_EXPIRED',
                            'error_code' => 'EXPIRED_INSURANCE',
                            'message' => $errorMsg,
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

                throw $insertEx;
            }
        } else {

            $updateVisitSql = "UPDATE patient_visit
                              SET start_at = NOW(), updated_by = ?
                              WHERE appointment_id = ?";
            executeQuery($conn, $updateVisitSql, 'si', [$receptionist_email, $appointment_id]);
        }

        $warningResult = $conn->query("SELECT @insurance_warning AS warning");
        $warningRow = $warningResult->fetch_assoc();
        $insuranceWarning = $warningRow['warning'] ?? null;

        $updateApptSql = "UPDATE appointment
                         SET Status = 'Checked-in'
                         WHERE Appointment_id = ? AND Status NOT IN ('Completed', 'Cancelled', 'No-Show')";
        executeQuery($conn, $updateApptSql, 'i', [$appointment_id]);

        $conn->commit();
        closeDBConnection($conn);

        $response = [
            'success' => true,
            'message' => 'Patient checked in successfully',
            'check_in_time' => date('Y-m-d H:i:s')
        ];

        if (!empty($insuranceWarning) && !$acknowledged_validation && !$force_checkin) {
            $response['insurance_warning'] = $insuranceWarning;
            $response['warning_type'] = 'INSURANCE_EXPIRING_SOON';

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