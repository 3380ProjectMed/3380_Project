<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
header('Content-Type: application/json');

try {
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    // Get JSON input - works for both POST and DELETE methods
    $rawInput = file_get_contents('php://input');
    error_log("Delete condition - Raw input: " . $rawInput); // DEBUG
    
    $input = json_decode($rawInput, true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON input', 'raw' => $rawInput]);
        exit;
    }

    error_log("Delete condition - Parsed input: " . json_encode($input)); // DEBUG
    
    $condition_id = isset($input['condition_id']) ? intval($input['condition_id']) : 0;
    $patient_id = isset($input['patient_id']) ? intval($input['patient_id']) : 0;

    error_log("Delete condition - condition_id: $condition_id, patient_id: $patient_id"); // DEBUG

    // Validation
    if ($condition_id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid condition_id is required']);
        exit;
    }

    if ($patient_id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid patient_id is required']);
        exit;
    }

    $conn = getDBConnection();

    // Verify the condition exists and belongs to the specified patient
    $checkSql = "SELECT condition_id FROM medical_condition 
                 WHERE condition_id = ? AND patient_id = ?";
    $existing = executeQuery($conn, $checkSql, 'ii', [$condition_id, $patient_id]);

    if (empty($existing)) {
        http_response_code(404);
        echo json_encode([
            'success' => false, 
            'error' => 'Medical condition not found or does not belong to this patient'
        ]);
        closeDBConnection($conn);
        exit;
    }

    // Delete the condition
    $deleteSql = "DELETE FROM medical_condition 
                  WHERE condition_id = ? AND patient_id = ?";
    
    executeQuery($conn, $deleteSql, 'ii', [$condition_id, $patient_id]);

    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'message' => 'Medical condition deleted successfully'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}