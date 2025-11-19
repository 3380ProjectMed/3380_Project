<?php

/**
 * Update appointment status
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    //session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['appointment_id']) || !isset($input['status'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing appointment_id or status']);
        exit;
    }

    $appointment_id = (int)$input['appointment_id'];
    $status = $input['status'];

    // Validate status
    $validStatuses = ['Scheduled', 'Pending', 'Waiting', 'In Progress', 'Completed', 'Cancelled', 'No-Show'];
    if (!in_array($status, $validStatuses)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid status']);
        exit;
    }

    $conn = getDBConnection();

    // Update the appointment status
    // appointment table has mixed case: Appointment_id, Status
    $sql = "UPDATE appointment SET Status = ? WHERE Appointment_id = ?";
    executeQuery($conn, $sql, 'si', [$status, $appointment_id]);

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'message' => 'Appointment status updated successfully'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
