<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/appointments/update.php
 * ==========================================
 * Update appointment details
 */
require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../database.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['Appointment_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Appointment_id required']);
        exit;
    }

    $conn = getDBConnection();
    
    $updates = [];
    $params = [];
    $types = '';
    
    if (isset($input['Appointment_date'])) {
        $updates[] = "Appointment_date = ?";
        $params[] = $input['Appointment_date'];
        $types .= 's';
    }
    
    if (isset($input['Reason_for_visit'])) {
        $updates[] = "Reason_for_visit = ?";
        $params[] = $input['Reason_for_visit'];
        $types .= 's';
    }
    
    if (isset($input['Doctor_id'])) {
        $updates[] = "Doctor_id = ?";
        $params[] = $input['Doctor_id'];
        $types .= 'i';
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No fields to update']);
        exit;
    }
    
    $params[] = $input['Appointment_id'];
    $types .= 'i';
    
    $sql = "UPDATE Appointment SET " . implode(', ', $updates) . " WHERE Appointment_id = ?";
    executeQuery($conn, $sql, $types, $params);
    
    closeDBConnection($conn);

    echo json_encode(['success' => true, 'message' => 'Appointment updated']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
