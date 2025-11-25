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

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
        exit;
    }

    $condition_id = isset($input['condition_id']) ? intval($input['condition_id']) : 0;
    $patient_id = isset($input['patient_id']) ? intval($input['patient_id']) : 0;
    $condition_name = isset($input['condition_name']) ? trim($input['condition_name']) : '';
    $diagnosis_date = isset($input['diagnosis_date']) ? trim($input['diagnosis_date']) : null;

    // Validation
    if ($patient_id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid patient_id is required']);
        exit;
    }

    if (empty($condition_name)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Condition name is required']);
        exit;
    }

    $conn = getDBConnection();
    $username = $_SESSION['username'] ?? 'system';

    // Check if patient exists
    $patientCheck = executeQuery($conn, "SELECT patient_id FROM patient WHERE patient_id = ?", 'i', [$patient_id]);
    if (empty($patientCheck)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Patient not found']);
        closeDBConnection($conn);
        exit;
    }

    if ($condition_id > 0) {
        // UPDATE existing condition
        $sql = "UPDATE medical_condition 
                SET condition_name = ?,
                    diagnosis_date = ?,
                    updated_by = ?
                WHERE condition_id = ? AND patient_id = ?";
        
        $params = [$condition_name, $diagnosis_date, $username, $condition_id, $patient_id];
        $types = 'sssii';
        
        executeQuery($conn, $sql, $types, $params);
        
        $response = [
            'success' => true,
            'message' => 'Medical condition updated successfully',
            'condition_id' => $condition_id
        ];
    } else {
        // INSERT new condition
        $sql = "INSERT INTO medical_condition 
                (patient_id, condition_name, diagnosis_date, created_by, updated_by) 
                VALUES (?, ?, ?, ?, ?)";
        
        $params = [$patient_id, $condition_name, $diagnosis_date, $username, $username];
        $types = 'issss';
        
        executeQuery($conn, $sql, $types, $params);
        
        $new_id = $conn->insert_id;
        
        $response = [
            'success' => true,
            'message' => 'Medical condition added successfully',
            'condition_id' => $new_id
        ];
    }

    closeDBConnection($conn);
    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}