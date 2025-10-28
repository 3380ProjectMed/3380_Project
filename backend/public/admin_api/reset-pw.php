<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    session_start();
    
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $user_id = isset($input['user_id']) ? intval($input['user_id']) : 0;
    $new_password = isset($input['new_password']) ? $input['new_password'] : '';
    
    if ($user_id === 0 || empty($new_password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'user_id and new_password are required']);
        exit;
    }
    
    // Password validation
    if (strlen($new_password) < 8) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Password must be at least 8 characters']);
        exit;
    }
    
    $conn = getDBConnection();
    
    $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
    
    $sql = "UPDATE user_account 
            SET password_hash = ?, 
                failed_login_count = 0 
            WHERE user_id = ?";
    
    executeQuery($conn, $sql, 'si', [$password_hash, $user_id]);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'message' => 'Password reset successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>