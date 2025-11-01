<?php
/**
 * Admin API: Create new user account
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    session_start();
    
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    $conn = getDBConnection();
    
    // Verify admin
    $checkSql = "SELECT role FROM user_account WHERE user_id = ?";
    $checkRows = executeQuery($conn, $checkSql, 'i', [(int)$_SESSION['uid']]);
    
    if (empty($checkRows) || $checkRows[0]['role'] !== 'ADMIN') {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }
    
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    $username = isset($input['username']) ? trim($input['username']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $password = isset($input['password']) ? $input['password'] : '';
    $role = isset($input['role']) ? strtoupper(trim($input['role'])) : 'PATIENT';
    
    // Validation
    if (empty($username) || empty($email) || empty($password)) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Username, email, and password are required']);
        exit;
    }
    
    if (!in_array($role, ['PATIENT', 'DOCTOR', 'ADMIN'])) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid role. Must be PATIENT, DOCTOR, or ADMIN']);
        exit;
    }
    
    // Check if username or email already exists
    $checkExistSql = "SELECT user_id FROM user_account WHERE username = ? OR email = ?";
    $existRows = executeQuery($conn, $checkExistSql, 'ss', [$username, $email]);
    
    if (!empty($existRows)) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Username or email already exists']);
        exit;
    }
    
    // Hash password
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert new user
    $insertSql = "INSERT INTO user_account (username, email, password_hash, role, is_active, created_at) 
                  VALUES (?, ?, ?, ?, 1, NOW())";
    
    $stmt = $conn->prepare($insertSql);
    if (!$stmt) {
        closeDBConnection($conn);
        throw new Exception('Prepare failed: ' . $conn->error);
    }
    
    $stmt->bind_param('ssss', $username, $email, $password_hash, $role);
    
    if (!$stmt->execute()) {
        $error = $stmt->error;
        $stmt->close();
        closeDBConnection($conn);
        throw new Exception('Insert failed: ' . $error);
    }
    
    $new_user_id = $stmt->insert_id;
    $stmt->close();
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'message' => 'User created successfully',
        'user_id' => $new_user_id
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>