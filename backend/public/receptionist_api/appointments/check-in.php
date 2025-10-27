<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/appointments/check-in.php
 * ==========================================
 * Check in patient for appointment
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
    $conn->begin_transaction();
    
    // Check if PatientVisit exists
    $checkSql = "SELECT Visit_id FROM PatientVisit WHERE Appointment_id = ?";
    $result = executeQuery($conn, $checkSql, 'i', [$input['Appointment_id']]);
    
    if (empty($result)) {
        // Create new PatientVisit
        $insertSql = "INSERT INTO PatientVisit (Appointment_id, Check_in_time, Status) 
                      VALUES (?, NOW(), 'Checked In')";
        executeQuery($conn, $insertSql, 'i', [$input['Appointment_id']]);
    } else {
        // Update existing PatientVisit
        $updateSql = "UPDATE PatientVisit 
                      SET Check_in_time = NOW(), Status = 'Checked In' 
                      WHERE Appointment_id = ?";
        executeQuery($conn, $updateSql, 'i', [$input['Appointment_id']]);
    }
    
    $conn->commit();
    closeDBConnection($conn);

    echo json_encode(['success' => true, 'message' => 'Patient checked in']);

} catch (Exception $e) {
    if (isset($conn)) $conn->rollback();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
