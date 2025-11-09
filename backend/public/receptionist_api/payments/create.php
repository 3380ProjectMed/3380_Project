<?php
/**
 * Record a payment for a visit
 * Calculates total including treatment costs from treatment_per_visit
 * Uses session-based authentication and correct patient_visit schema
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
    $copay_amount = isset($input['copay_amount']) ? (float)$input['copay_amount'] : null;
    $payment_method = isset($input['payment_method']) ? $input['payment_method'] : 'card';
    $notes = isset($input['notes']) ? trim($input['notes']) : '';
    
    if ($payment_amount <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Payment amount must be greater than zero']);
        exit;
    }
    
    $user_id = (int)$_SESSION['uid'];
    
    $conn = getDBConnection();
    
    // Verify receptionist and get their info
    $staffRows = executeQuery($conn, '
        SELECT s.work_location as office_id, CONCAT(s.first_name, " ", s.last_name) as staff_name, s.staff_email
        FROM staff s
        JOIN user_account ua ON ua.email = s.staff_email
        WHERE ua.user_id = ?', 'i', [$user_id]);
    
    if (empty($staffRows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No receptionist account found']);
        exit;
    }
    
    $receptionist_name = $staffRows[0]['staff_name'];
    $receptionist_office = (int)$staffRows[0]['office_id'];
    
    // Verify the visit exists and belongs to receptionist's office
    $visitRows = executeQuery($conn, '
        SELECT 
            pv.visit_id, 
            pv.office_id, 
            pv.patient_id, 
            pv.appointment_id,
            pv.insurance_policy_id_used,
            pv.payment as existing_payment,
            pv.copay_amount_due as existing_copay,
            -- Get insurance copay if available
            iplan.copay as plan_copay
        FROM patient_visit pv
        LEFT JOIN patient_insurance pi ON pv.insurance_policy_id_used = pi.id
        LEFT JOIN insurance_plan iplan ON pi.plan_id = iplan.plan_id
        WHERE pv.visit_id = ? AND pv.office_id = ?', 
        'ii', [$visit_id, $receptionist_office]);
    
    if (empty($visitRows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Visit not found or access denied']);
        exit;
    }
    
    $visit = $visitRows[0];
    
    // Check if payment already exists
    if ($visit['existing_payment'] && $visit['existing_payment'] > 0) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'error' => 'Payment already recorded for this visit',
            'existing_payment' => number_format((float)$visit['existing_payment'], 2)
        ]);
        exit;
    }
    
    // Calculate treatment costs for this visit
    $treatmentRows = executeQuery($conn, '
        SELECT COALESCE(SUM(total_cost), 0) as treatment_total
        FROM treatment_per_visit
        WHERE visit_id = ?', 'i', [$visit_id]);
    
    $treatment_total = (float)($treatmentRows[0]['treatment_total'] ?? 0);
    
    // Determine copay amount
    // Priority: explicitly provided > existing in visit > from insurance plan
    if ($copay_amount !== null) {
        $final_copay = $copay_amount;
    } elseif ($visit['existing_copay']) {
        $final_copay = (float)$visit['existing_copay'];
    } elseif ($visit['plan_copay']) {
        $final_copay = (float)$visit['plan_copay'];
    } else {
        $final_copay = 0;
    }
    
    // Calculate amounts
    // amount_due = copay + treatments (what patient owes)
    // payment = what patient actually paid
    // total_due = amount_due - payment (remaining balance)
    $amount_due = $final_copay + $treatment_total;
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
                         last_updated = NOW(),
                         updated_by = ?
                     WHERE visit_id = ?";
        
        executeQuery($conn, $updateSql, 'ddddsi', [
            $payment_amount,
            $final_copay,
            $treatment_total,
            $amount_due,
            $total_due,
            $receptionist_name,
            $visit_id
        ]);
        
        // Optional: Create a payment_log table entry for audit trail
        // This would require creating a new table
        
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
                pv.appointment_id,
                pv.last_updated,
                CONCAT(p.first_name, " ", p.last_name) as patient_name
            FROM patient_visit pv
            INNER JOIN patient p ON pv.patient_id = p.patient_id
            WHERE pv.visit_id = ?', 'i', [$visit_id]);
        
        $result = $resultRows[0];
        
        closeDBConnection($conn);
        
        // Generate a simple transaction ID
        $transaction_id = 'TXN' . date('Ymd') . '-' . str_pad($visit_id, 6, '0', STR_PAD_LEFT);
        
        echo json_encode([
            'success' => true,
            'message' => 'Payment recorded successfully',
            'transaction_id' => $transaction_id,
            'payment' => [
                'visit_id' => $visit_id,
                'patient_id' => $result['patient_id'],
                'patient_name' => $result['patient_name'],
                'appointment_id' => $result['appointment_id'],
                'payment_amount' => number_format($payment_amount, 2),
                'copay_amount' => number_format($final_copay, 2),
                'treatment_cost' => number_format($treatment_total, 2),
                'amount_due' => number_format((float)$result['amount_due'], 2),
                'balance_remaining' => number_format((float)$result['total_due'], 2),
                'is_fully_paid' => $result['total_due'] <= 0,
                'payment_method' => $payment_method,
                'recorded_at' => $result['last_updated'],
                'recorded_by' => $receptionist_name,
                'notes' => $notes
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