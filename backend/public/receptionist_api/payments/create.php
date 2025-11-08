<?php
/**
 * Record a payment
 * Calculates total including treatment costs from treatment_per_visit
 * Uses session-based authentication and actual patient_visit schema
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
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($input['visit_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'visit_id is required']);
        exit;
    }
    
    if (!isset($input['payment_amount'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'payment_amount is required']);
        exit;
    }
    
    $visit_id = (int)$input['visit_id'];
    $payment_amount = (float)$input['payment_amount'];
    $copay_amount = isset($input['copay_amount']) ? (float)$input['copay_amount'] : 0;
    $payment_method = isset($input['payment_method']) ? $input['payment_method'] : 'Card';
    $transaction_id = isset($input['transaction_id']) ? $input['transaction_id'] : null;
    $notes = isset($input['notes']) ? $input['notes'] : '';
    
    $user_id = (int)$_SESSION['uid'];
    
    $conn = getDBConnection();
    
    // Verify receptionist and get their info
    $staffRows = executeQuery($conn, '
        SELECT s.work_location as office_id, s.staff_email
        FROM staff s
        JOIN user_account ua ON ua.email = s.staff_email
        WHERE ua.user_id = ?', 'i', [$user_id]);
    
    if (empty($staffRows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No receptionist account found']);
        exit;
    }
    
    $receptionist_email = $staffRows[0]['staff_email'];
    $receptionist_office = (int)$staffRows[0]['office_id'];
    
    // Verify the visit exists and belongs to receptionist's office
    $visitRows = executeQuery($conn, '
        SELECT pv.visit_id, pv.office_id, pv.patient_id, pv.appointment_id
        FROM patient_visit pv
        WHERE pv.visit_id = ? AND pv.office_id = ?', 
        'ii', [$visit_id, $receptionist_office]);
    
    if (empty($visitRows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Visit not found or access denied']);
        exit;
    }
    
    // Calculate treatment costs for this visit
    $treatmentRows = executeQuery($conn, '
        SELECT COALESCE(SUM(total_cost), 0) as treatment_total
        FROM treatment_per_visit
        WHERE visit_id = ?', 'i', [$visit_id]);
    
    $treatment_total = (float)($treatmentRows[0]['treatment_total'] ?? 0);
    
    // Calculate amounts
    // amount_due = copay + treatments
    // total_due = amount_due - payment
    $amount_due = $copay_amount + $treatment_total;
    $total_due = $amount_due - $payment_amount;
    
    $conn->begin_transaction();
    
    try {
        // Update patient_visit with payment information
        $updateSql = "UPDATE patient_visit
                     SET status = 'Completed',
                         payment = ?,
                         copay_amount_due = ?,
                         treatment_cost_due = ?,
                         amount_due = ?,
                         total_due = ?,
                         updated_by = ?
                     WHERE visit_id = ?";
        
        executeQuery($conn, $updateSql, 'ddddssi', [
            $payment_amount,
            $copay_amount,
            $treatment_total,
            $amount_due,
            $total_due,
            $receptionist_email,
            $visit_id
        ]);
        
        $conn->commit();
        
        // Get updated visit details for response
        $resultRows = executeQuery($conn, '
            SELECT 
                pv.visit_id,
                pv.payment,
                pv.copay_amount_due,
                pv.treatment_cost_due,
                pv.amount_due,
                pv.total_due,
                pv.patient_id,
                pv.appointment_id
            FROM patient_visit pv
            WHERE pv.visit_id = ?', 'i', [$visit_id]);
        
        $result = $resultRows[0];
        
        closeDBConnection($conn);
        
        echo json_encode([
            'success' => true,
            'message' => 'Payment recorded successfully',
            'payment' => [
                'visit_id' => $visit_id,
                'payment_amount' => number_format($payment_amount, 2),
                'copay_amount' => number_format($copay_amount, 2),
                'treatment_cost' => number_format($treatment_total, 2),
                'amount_due' => number_format((float)$result['amount_due'], 2),
                'total_due' => number_format((float)$result['total_due'], 2),
                'balance_remaining' => number_format((float)$result['total_due'], 2),
                'payment_method' => $payment_method,
                'transaction_id' => $transaction_id,
                'patient_id' => $result['patient_id'],
                'appointment_id' => $result['appointment_id']
            ]
        ]);
        
    } catch (Exception $ex) {
        $conn->rollback();
        closeDBConnection($conn);
        throw $ex;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>