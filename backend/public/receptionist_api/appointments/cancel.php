<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/appointments/cancel.php
 * ==========================================
 * Cancel appointment
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
    
    // Update PatientVisit status to Canceled
    $sql = "UPDATE PatientVisit SET Status = 'Canceled' WHERE Appointment_id = ?";
    executeQuery($conn, $sql, 'i', [$input['Appointment_id']]);
    
    // If no PatientVisit exists yet, create one with Canceled status
    $checkSql = "SELECT COUNT(*) as cnt FROM PatientVisit WHERE Appointment_id = ?";
    $result = executeQuery($conn, $checkSql, 'i', [$input['Appointment_id']]);
    
    if ($result[0]['cnt'] == 0) {
        $insertSql = "INSERT INTO PatientVisit (Appointment_id, Status) VALUES (?, 'Canceled')";
        executeQuery($conn, $insertSql, 'i', [$input['Appointment_id']]);
    }
    
    $conn->commit();
    closeDBConnection($conn);

    echo json_encode(['success' => true, 'message' => 'Appointment canceled']);

} catch (Exception $e) {
    if (isset($conn)) $conn->rollback();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
