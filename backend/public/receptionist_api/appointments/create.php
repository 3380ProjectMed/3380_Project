<?php

/**
 * Create a new appointment
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

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    $required = ['Patient_id', 'Doctor_id', 'Appointment_date', 'Office_id'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "$field is required"]);
            exit;
        }
    }

    $user_id = (int)$_SESSION['uid'];

    $conn = getDBConnection();

    // Verify receptionist works at the specified office
    $verifySql = "SELECT ws.office_id
                  FROM staff s
                  JOIN user_account ua ON ua.email = s.staff_email
                  JOIN work_schedule ws ON ws.staff_id = s.staff_id
                  WHERE ua.user_id = ? AND ws.office_id = ?";

    $verifyResult = executeQuery($conn, $verifySql, 'ii', [$user_id, $input['Office_id']]);

    if (empty($verifyResult)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied - you can only create appointments for your office']);
        exit;
    }

    // Verify doctor exists and get staff_id for schedule checks
    $doctorSql = "SELECT doctor_id, staff_id FROM doctor WHERE doctor_id = ?";
    $doctorResult = executeQuery($conn, $doctorSql, 'i', [$input['Doctor_id']]);

    if (empty($doctorResult)) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid doctor ID']);
        exit;
    }
    $doctorRow = $doctorResult[0];
    $doctor_staff_id = (int)$doctorRow['staff_id'];

    // Validate appointment datetime falls within the doctor's work_schedule for that office
    try {
        $apptDT = new DateTime($input['Appointment_date']);
        $dayOfWeek = $apptDT->format('l'); // e.g., Monday
        $timeHHMM = $apptDT->format('H:i'); // e.g., 14:30

        $scheduleCheckSql = "SELECT 1 FROM work_schedule WHERE staff_id = ? AND office_id = ? AND day_of_week = ? AND start_time <= ? AND end_time > ? LIMIT 1";
        $scheduleMatch = executeQuery($conn, $scheduleCheckSql, 'iisss', [$doctor_staff_id, $input['Office_id'], $dayOfWeek, $timeHHMM, $timeHHMM]);

        if (empty($scheduleMatch)) {
            closeDBConnection($conn);
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Doctor is not scheduled to work at the requested date/time']);
            exit;
        }
    } catch (Exception $e) {
        // If parsing fails, reject the request
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid appointment date/time']);
        exit;
    }

    // Verify patient exists
    $patientSql = "SELECT patient_id FROM patient WHERE patient_id = ?";
    $patientResult = executeQuery($conn, $patientSql, 'i', [$input['Patient_id']]);

    if (empty($patientResult)) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid patient ID']);
        exit;
    }

    $conn->begin_transaction();

    try {
        // Insert appointment
        $insertSql = "INSERT INTO appointment (
                        Patient_id, 
                        Doctor_id, 
                        Appointment_date, 
                        Reason_for_visit, 
                        Office_id,
                        Status,
                        method,
                        Date_created
                      ) VALUES (?, ?, ?, ?, ?, 'Scheduled', ?, NOW())";

        $reason = $input['Reason_for_visit'] ?? 'General Visit';
        
        // Map booking_channel to method (database column)
        $bookingMethod = 'Walk-in'; // default
        if (isset($input['booking_channel'])) {
            $channel = strtolower($input['booking_channel']);
            if ($channel === 'phone') {
                $bookingMethod = 'Phone';
            } elseif ($channel === 'online') {
                $bookingMethod = 'Online';
            } elseif ($channel === 'walk-in') {
                $bookingMethod = 'Walk-in';
            }
        }

        executeQuery($conn, $insertSql, 'iissis', [
            $input['Patient_id'],
            $input['Doctor_id'],
            $input['Appointment_date'],
            $reason,
            $input['Office_id'],
            $bookingMethod
        ]);

        $appointment_id = $conn->insert_id;

        $conn->commit();
        closeDBConnection($conn);

        echo json_encode([
            'success' => true,
            'message' => 'Appointment created successfully',
            'appointment_id' => $appointment_id,
            'appointmentIdFormatted' => 'A' . str_pad($appointment_id, 4, '0', STR_PAD_LEFT)
        ]);
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
