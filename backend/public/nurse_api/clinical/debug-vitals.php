<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
header('Content-Type: application/json');

session_start();
if (empty($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'UNAUTHENTICATED']);
    exit;
}

try {
    $conn = getDBConnection();
    $email = $_SESSION['email'] ?? '';
    
    echo json_encode([
        'step' => 'session_check',
        'success' => true,
        'session_uid' => $_SESSION['uid'] ?? 'missing',
        'session_email' => $email,
        'get_params' => $_GET,
        'post_body' => file_get_contents('php://input')
    ]);
    
} catch (Throwable $e) {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => 'DEBUG_FAILED',
        'message' => $e->getMessage()
    ]);
}
?>