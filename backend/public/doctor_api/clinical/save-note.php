<?php

/**
 * Save/update clinical note and diagnosis in patient_visit
 * Note: Treatment field removed - treatments now in treatment_per_visit table
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
header('Content-Type: application/json');

try {
    //session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $user_id = (int)$_SESSION['uid'];

    // Get doctor info
    $conn = getDBConnection();
    $rows = executeQuery($conn, 'SELECT d.doctor_id, CONCAT(s.first_name, " ", s.last_name) as doctor_name
            FROM user_account ua
            JOIN staff s ON ua.user_id = s.staff_id
            JOIN doctor d ON s.staff_id = d.staff_id
            WHERE ua.user_id = ? 
            LIMIT 1
            ', 'i', [$user_id]);
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No doctor account found']);
        exit;
    }

    $doctor_id = (int)$rows[0]['doctor_id'];
    $doctor_name = $rows[0]['doctor_name'];

    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);

    $visit_id = isset($input['visit_id']) ? intval($input['visit_id']) : 0;

    // Handle appointment IDs - strip "A" prefix if present
    $appointment_id_raw = isset($input['appointment_id']) ? trim($input['appointment_id']) : '';
    $appointment_id = 0;
    if (!empty($appointment_id_raw)) {
        $cleaned_id = $appointment_id_raw;
        if (strtoupper(substr($cleaned_id, 0, 1)) === 'A') {
            $cleaned_id = substr($cleaned_id, 1);
        }
        $appointment_id = intval($cleaned_id);
    }

    $diagnosis = isset($input['diagnosis']) ? trim($input['diagnosis']) : '';
    $present_illnesses = isset($input['present_illnesses']) ? trim($input['present_illnesses']) : null;

    if ($visit_id === 0 && $appointment_id === 0) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'visit_id or appointment_id required']);
        exit;
    }

    if (empty($diagnosis)) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Diagnosis cannot be empty']);
        exit;
    }

    // If we have appointment_id, find the visit
    if ($visit_id === 0 && $appointment_id > 0) {
        $visitRows = executeQuery(
            $conn,
            'SELECT visit_id FROM patient_visit WHERE appointment_id = ? LIMIT 1',
            'i',
            [$appointment_id]
        );

        if (!empty($visitRows)) {
            $visit_id = (int)$visitRows[0]['visit_id'];
        } else {
            closeDBConnection($conn);
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'No visit found for this appointment. Patient must check in first.'
            ]);
            exit;
        }
    }

    // Update the diagnosis and present_illnesses in patient_visit
    $sql = "UPDATE patient_visit 
            SET diagnosis = ?,
                present_illnesses = COALESCE(?, present_illnesses),
                last_updated = NOW(),
                updated_by = ?
            WHERE visit_id = ?";

    executeQuery($conn, $sql, 'sssi', [$diagnosis, $present_illnesses, $doctor_name, $visit_id]);

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'message' => 'Diagnosis saved successfully',
        'visit_id' => $visit_id
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
