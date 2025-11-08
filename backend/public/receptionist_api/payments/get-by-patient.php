<?php
/**
 * Get payment details for a specific visit
 * Shows copay, treatment costs, and total amount due
 * Uses session-based authentication
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
    
    if (!isset($_GET['visit_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'visit_id parameter is required']);
        exit;
    }
    
    $visit_id = (int)$_GET['visit_id'];
    $user_id = (int)$_SESSION['uid'];
    
    $conn = getDBConnection();
    
    // Verify receptionist
    $staffRows = executeQuery($conn, '
        SELECT s.work_location as office_id
        FROM staff s
        JOIN user_account ua ON ua.email = s.staff_email
        WHERE ua.user_id = ?', 'i', [$user_id]);
    
    if (empty($staffRows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No receptionist account found']);
        exit;
    }
    
    $receptionist_office = (int)$staffRows[0]['office_id'];
    
    // Get visit details
    $visitSql = "SELECT 
                    pv.visit_id,
                    pv.patient_id,
                    pv.appointment_id,
                    pv.office_id,
                    pv.date as visit_date,
                    pv.payment,
                    pv.copay_amount_due,
                    pv.treatment_cost_due,
                    pv.amount_due,
                    pv.total_due,
                    pv.status,
                    CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                    CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                    o.name as office_name
                FROM patient_visit pv
                INNER JOIN patient p ON pv.patient_id = p.patient_id
                LEFT JOIN doctor d ON pv.doctor_id = d.doctor_id
                LEFT JOIN office o ON pv.office_id = o.office_id
                WHERE pv.visit_id = ? AND pv.office_id = ?";
    
    $visitRows = executeQuery($conn, $visitSql, 'ii', [$visit_id, $receptionist_office]);
    
    if (empty($visitRows)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Visit not found or access denied']);
        exit;
    }
    
    $visit = $visitRows[0];
    
    // Get insurance copay amount (from patient insurance if available)
    $insuranceSql = "SELECT 
                        pi.copay_amount,
                        pi.policy_number,
                        ic.company_name as insurance_company
                    FROM patient_insurance pi
                    LEFT JOIN insurance_company ic ON pi.company_id = ic.company_id
                    WHERE pi.patient_id = ? AND pi.is_active = 1
                    LIMIT 1";
    
    $insuranceRows = executeQuery($conn, $insuranceSql, 'i', [$visit['patient_id']]);
    
    $copay_from_insurance = 0;
    $insurance_info = null;
    
    if (!empty($insuranceRows)) {
        $copay_from_insurance = (float)($insuranceRows[0]['copay_amount'] ?? 0);
        $insurance_info = [
            'company' => $insuranceRows[0]['insurance_company'],
            'policy_number' => $insuranceRows[0]['policy_number'],
            'copay' => number_format($copay_from_insurance, 2)
        ];
    }
    
    // Get treatment details for this visit
    $treatmentSql = "SELECT 
                        tc.treatment_name,
                        tc.description,
                        tpv.quantity,
                        tpv.cost_each,
                        tpv.total_cost,
                        tpv.notes
                    FROM treatment_per_visit tpv
                    LEFT JOIN treatment_catalog tc ON tpv.treatment_id = tc.treatment_id
                    WHERE tpv.visit_id = ?";
    
    $treatments = executeQuery($conn, $treatmentSql, 'i', [$visit_id]);
    
    $treatment_list = [];
    $calculated_treatment_total = 0;
    
    foreach ($treatments as $t) {
        $total = (float)$t['total_cost'];
        $calculated_treatment_total += $total;
        
        $treatment_list[] = [
            'name' => $t['treatment_name'],
            'description' => $t['description'],
            'quantity' => (int)$t['quantity'],
            'cost_each' => number_format((float)$t['cost_each'], 2),
            'total_cost' => number_format($total, 2),
            'notes' => $t['notes']
        ];
    }
    
    // Calculate payment breakdown
    $copay = $visit['copay_amount_due'] ? (float)$visit['copay_amount_due'] : $copay_from_insurance;
    $treatment_cost = (float)($visit['treatment_cost_due'] ?? $calculated_treatment_total);
    $total_amount_due = $copay + $treatment_cost;
    $payment_made = (float)($visit['payment'] ?? 0);
    $balance = $total_amount_due - $payment_made;
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'visit' => [
            'visit_id' => $visit['visit_id'],
            'patient_id' => $visit['patient_id'],
            'patient_name' => $visit['patient_name'],
            'appointment_id' => $visit['appointment_id'],
            'appointment_id_formatted' => $visit['appointment_id'] ? 'A' . str_pad($visit['appointment_id'], 4, '0', STR_PAD_LEFT) : 'N/A',
            'visit_date' => $visit['visit_date'],
            'doctor_name' => $visit['doctor_name'],
            'office_name' => $visit['office_name'],
            'status' => $visit['status']
        ],
        'insurance' => $insurance_info,
        'payment_breakdown' => [
            'copay_amount' => number_format($copay, 2),
            'treatment_cost' => number_format($treatment_cost, 2),
            'subtotal' => number_format($total_amount_due, 2),
            'payment_made' => number_format($payment_made, 2),
            'balance_due' => number_format($balance, 2),
            'is_paid' => $balance <= 0
        ],
        'treatments' => $treatment_list,
        'treatment_count' => count($treatment_list)
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