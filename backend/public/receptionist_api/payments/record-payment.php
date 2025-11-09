<?php
/**
 * SIMPLE VERSION - Record a payment
 * Just saves payment amount to patient_visit
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

header('Content-Type: application/json');

try {
    session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'POST only']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['visit_id']) || !isset($input['amount'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'visit_id and amount required']);
        exit;
    }
    
    $visit_id = (int)$input['visit_id'];
    $amount = (float)$input['amount'];
    $method = isset($input['method']) ? $input['method'] : 'card';
    
    if ($amount <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Amount must be greater than 0']);
        exit;
    }
    
    $conn = getDBConnection();
    
    // Check if already paid
    $checkSql = "SELECT payment FROM patient_visit WHERE visit_id = ?";
    $existing = executeQuery($conn, $checkSql, 'i', [$visit_id]);
    
    if (empty($existing)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Visit not found']);
        exit;
    }
    
    if ($existing[0]['payment'] && (float)$existing[0]['payment'] > 0) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Payment already recorded']);
        exit;
    }
    
    // Simple update - just save the payment
    $updateSql = "UPDATE patient_visit 
                  SET payment = ?,
                      payment_method = ?,
                      status = 'Completed',
                      last_updated = NOW()
                  WHERE visit_id = ?";
    
    executeQuery($conn, $updateSql, 'dsi', [$amount, $method, $visit_id]);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'message' => 'Payment recorded',
        'visit_id' => $visit_id,
        'amount' => number_format($amount, 2),
        'method' => $method
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>