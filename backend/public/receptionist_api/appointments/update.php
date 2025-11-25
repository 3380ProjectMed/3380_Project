<?php

/**
 * Update an existing appointment
 * Uses session-based authentication like doctor API
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

    if (isset($input['Appointment_id'])) unset($input['Appointment_id']);
    if (isset($input['appointment_id'])) unset($input['appointment_id']);
    if (isset($input['Appointment_id'])) unset($input['Appointment_id']);
    if (isset($input['appointment_id'])) unset($input['appointment_id']);

    $conn = getDBConnection();

    $verifySql = "SELECT a.Appointment_id, a.Office_id, a.Patient_id, a.Status
                  FROM appointment a
                  JOIN user_account ua ON ua.user_id = ?
                  JOIN staff s ON ua.email = s.staff_email
                  JOIN work_schedule ws ON ws.staff_id = s.staff_id AND ws.office_id = a.Office_id
                  WHERE a.Appointment_id = ?";

    $verifyResult = executeQuery($conn, $verifySql, 'ii', [$user_id, $appointment_id]);

    $isPatientOwner = false;
    $isReceptionist = !empty($verifyResult);

    if (empty($verifyResult)) {
        $patientCheckSql = "SELECT Appointment_id, Patient_id, Status FROM appointment WHERE Appointment_id = ? AND Patient_id = ?";
        $patientResult = executeQuery($conn, $patientCheckSql, 'ii', [$appointment_id, $user_id]);

        if (!empty($patientResult)) {
            $isPatientOwner = true;
            $appointmentStatus = $patientResult[0]['Status'] ?? null;
        }
    } else {
        $appointmentStatus = $verifyResult[0]['Status'] ?? null;
    }

    if (!$isReceptionist && !$isPatientOwner) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied or appointment not found']);
        exit;
    }

    
    $updateFields = [];
    $types = '';
    $values = [];

    if (isset($input['Appointment_date'])) {
        $updateFields[] = 'Appointment_date = ?';
        $types .= 's';
        $values[] = $input['Appointment_date'];
    }

    if (isset($input['Reason_for_visit'])) {
        $updateFields[] = 'Reason_for_visit = ?';
        $types .= 's';
        $values[] = $input['Reason_for_visit'];
    }

    if (isset($input['Doctor_id'])) {
        $updateFields[] = 'Doctor_id = ?';
        $types .= 'i';
        $values[] = $input['Doctor_id'];
    }

    
    if (isset($input['Status']) && $isReceptionist) {
        $validStatuses = ['Scheduled', 'Pending', 'Waiting', 'Checked-in', 'In Progress', 'Completed', 'Cancelled', 'No-Show'];
        if (in_array($input['Status'], $validStatuses)) {
            $updateFields[] = 'Status = ?';
            $types .= 's';
            $values[] = $input['Status'];
        }
    }

    if (isset($input['booking_channel'])) {
        $channel = strtolower($input['booking_channel']);
        $bookingMethod = null;
        if ($channel === 'phone') {
            $bookingMethod = 'Phone';
        } elseif ($channel === 'online') {
            $bookingMethod = 'Online';
        } elseif ($channel === 'walk-in') {
            $bookingMethod = 'Walk-in';
        }
        
        if ($bookingMethod) {
            $updateFields[] = 'method = ?';
            $types .= 's';
            $values[] = $bookingMethod;
        }
    }

    if ($isPatientOwner) {
        $forbiddenStatuses = ['Checked-in', 'Checked in', 'Cancelled', 'Canceled', 'No-Show', 'No-Show'];
        if (in_array($appointmentStatus, $forbiddenStatuses)) {
            closeDBConnection($conn);
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Cannot edit appointment in its current status']);
            exit;
        }
        $allowedForPatient = ['Appointment_date', 'Reason_for_visit', 'Doctor_id', 'method', 'booking_channel'];
        $updateFields = array_values(array_filter($updateFields, function($f) use ($allowedForPatient) {
            foreach ($allowedForPatient as $allowed) {
                if (stripos($f, $allowed) !== false) return true;
            }
            return false;
        }));
    }

    if (empty($updateFields)) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No valid fields to update']);
        exit;
    }

    $conn->begin_transaction();

    try {
    $values[] = $appointment_id;
        $types .= 'i';

        $updateSql = "UPDATE appointment SET " . implode(', ', $updateFields) . " WHERE Appointment_id = ?";
        executeQuery($conn, $updateSql, $types, $values);

        $conn->commit();
        closeDBConnection($conn);

        echo json_encode([
            'success' => true,
            'message' => 'Appointment updated successfully',
            'appointment_id' => $appointment_id
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
