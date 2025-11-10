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
    
    // Validate payment method
    $valid_methods = ['cash', 'card', 'check'];
    if (!in_array($method, $valid_methods)) {
        $method = 'card';
    }
    
    if ($amount <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Amount must be greater than 0']);
        exit;
    }
    
    $conn = getDBConnection();
    
    // Get receptionist info
    $staffRows = executeQuery($conn, '
        SELECT s.work_location as office_id, CONCAT(s.first_name, " ", s.last_name) as staff_name
        FROM staff s
        JOIN user_account ua ON ua.email = s.staff_email
        WHERE ua.user_id = ?', 'i', [(int)$_SESSION['uid']]);
    
    if (empty($staffRows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No receptionist account found']);
        exit;
    }
    
    $receptionist_name = $staffRows[0]['staff_name'];
    $office_id = (int)$staffRows[0]['office_id'];
    
    // Check if visit exists and belongs to this office
    $checkSql = "SELECT payment, office_id FROM patient_visit WHERE visit_id = ?";
    $existing = executeQuery($conn, $checkSql, 'i', [$visit_id]);
    
    if (empty($existing)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Visit not found']);
        exit;
    }
    
    if ((int)$existing[0]['office_id'] !== $office_id) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied to this visit']);
        exit;
    }
    
    if ($existing[0]['payment'] && (float)$existing[0]['payment'] > 0) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'error' => 'Payment already recorded',
            'existing_payment' => number_format((float)$existing[0]['payment'], 2)
        ]);
        exit;
    }
    
    // Update with payment
    $updateSql = "UPDATE patient_visit 
                  SET payment = ?,
                      payment_method = ?,
                      status = 'Completed',
                      last_updated = NOW(),
                      updated_by = ?
                  WHERE visit_id = ?";
    
    executeQuery($conn, $updateSql, 'dssi', [$amount, $method, $receptionist_name, $visit_id]);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'message' => 'Payment recorded successfully',
        'visit_id' => $visit_id,
        'amount' => number_format($amount, 2),
        'method' => $method,
        'recorded_by' => $receptionist_name
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>