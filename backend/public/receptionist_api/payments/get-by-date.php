<?php
/**
 * Get payments for a specific date at receptionist's office
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
    
    if (!isset($_GET['date'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'date parameter is required (format: YYYY-MM-DD)']);
        exit;
    }
    
    $date = $_GET['date'];
    $user_id = (int)$_SESSION['uid'];
    
    // Validate date format
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid date format. Use YYYY-MM-DD']);
        exit;
    }
    
    $conn = getDBConnection();
    
    // Get receptionist's office
    $rows = executeQuery($conn, '
        SELECT s.work_location as office_id, CONCAT(s.first_name, " ", s.last_name) as staff_name
        FROM staff s
        JOIN user_account ua ON ua.email = s.staff_email
        WHERE ua.user_id = ?', 'i', [$user_id]);
    
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No receptionist account associated with the logged-in user']);
        exit;
    }
    
    $office_id = (int)$rows[0]['office_id'];
    $receptionist_name = $rows[0]['staff_name'];
    
    // Get payments for this office on the specified date
    // Payment is recorded when the patient_visit is updated with payment amount
    $sql = "SELECT 
                pv.visit_id,
                pv.payment,
                pv.copay_amount_due,
                pv.amount_due,
                pv.total_due,
                pv.treatment_cost_due,
                pv.date as visit_date,
                pv.last_updated as payment_recorded_at,
                pv.updated_by as recorded_by,
                pv.patient_id,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                p.dob,
                pv.appointment_id,
                a.Appointment_date,
                CONCAT(doc_staff.first_name, ' ', doc_staff.last_name) as doctor_name,
                -- Insurance info
                ipayer.name as payer_name,
                iplan.plan_name
            FROM patient_visit pv
            LEFT JOIN Appointment a ON pv.appointment_id = a.Appointment_id
            INNER JOIN patient p ON pv.patient_id = p.patient_id
            LEFT JOIN doctor d ON pv.doctor_id = d.doctor_id
            LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
            LEFT JOIN patient_insurance pi ON pv.insurance_policy_id_used = pi.id
            LEFT JOIN insurance_plan iplan ON pi.plan_id = iplan.plan_id
            LEFT JOIN insurance_payer ipayer ON iplan.payer_id = ipayer.payer_id
            WHERE pv.office_id = ?
            AND DATE(pv.last_updated) = ?
            AND pv.payment IS NOT NULL
            AND pv.payment > 0
            ORDER BY pv.last_updated DESC";
    
    $payments = executeQuery($conn, $sql, 'is', [$office_id, $date]);
    
    $formatted_payments = [];
    $totals = [
        'cash' => 0,
        'card' => 0,
        'check' => 0,
        'insurance_covered' => 0,
        'copay_collected' => 0,
        'treatment_costs' => 0,
        'total_collected' => 0,
        'count' => 0
    ];
    
    if (is_array($payments)) {
        foreach ($payments as $payment) {
            $amount = (float)$payment['payment'];
            $copay = (float)($payment['copay_amount_due'] ?? 0);
            $treatment_cost = (float)($payment['treatment_cost_due'] ?? 0);
            
            // Calculate totals
            $totals['total_collected'] += $amount;
            $totals['copay_collected'] += $copay;
            $totals['treatment_costs'] += $treatment_cost;
            $totals['count']++;
            
            // Simplified payment method tracking (we could add a payment_method column to patient_visit later)
            $totals['card'] += $amount; // Default assumption for now
            
            // Get treatment details for this visit
            $treatmentSql = "SELECT 
                                tc.name as treatment_name,
                                tpv.quantity,
                                tpv.cost_each,
                                tpv.total_cost
                            FROM treatment_per_visit tpv
                            LEFT JOIN treatment_catalog tc ON tpv.treatment_id = tc.treatment_id
                            WHERE tpv.visit_id = ?
                            ORDER BY tc.name";
            
            $treatments = executeQuery($conn, $treatmentSql, 'i', [$payment['visit_id']]);
            
            $treatment_summary = '';
            if (is_array($treatments) && !empty($treatments)) {
                $treatment_names = array_map(function($t) {
                    return $t['treatment_name'] . ' (x' . $t['quantity'] . ')';
                }, $treatments);
                $treatment_summary = implode(', ', $treatment_names);
            }
            
            $formatted_payments[] = [
                'payment_id' => $payment['visit_id'],
                'visit_id' => $payment['visit_id'],
                'amount' => number_format($amount, 2),
                'copay_amount' => number_format($copay, 2),
                'treatment_cost' => number_format($treatment_cost, 2),
                'balance' => number_format((float)($payment['total_due'] ?? 0), 2),
                'payment_date' => date('Y-m-d', strtotime($payment['payment_recorded_at'])),
                'payment_time' => date('g:i A', strtotime($payment['payment_recorded_at'])),
                'visit_date' => $payment['visit_date'] ? date('Y-m-d', strtotime($payment['visit_date'])) : null,
                'payment_method' => $copay > 0 ? 'Insurance + Card' : 'Card', // Simplified for now
                'recorded_by' => $payment['recorded_by'] ?? 'System',
                'patient_id' => $payment['patient_id'],
                'patient_id_formatted' => 'P' . str_pad($payment['patient_id'], 3, '0', STR_PAD_LEFT),
                'patient_name' => $payment['patient_name'],
                'patient_dob' => $payment['dob'],
                'appointment_id' => $payment['appointment_id'],
                'appointment_id_formatted' => $payment['appointment_id'] ? 'A' . str_pad($payment['appointment_id'], 4, '0', STR_PAD_LEFT) : 'N/A',
                'appointment_time' => $payment['appointment_date'] ? date('g:i A', strtotime($payment['appointment_date'])) : 'N/A',
                'doctor_name' => $payment['doctor_name'],
                'insurance_provider' => $payment['payer_name'],
                'insurance_plan' => $payment['plan_name'],
                'treatment_summary' => $treatment_summary
            ];
        }
    }
    
    // Format totals
    foreach ($totals as $key => $value) {
        if ($key !== 'count') {
            $totals[$key] = number_format($value, 2);
        }
    }
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'payments' => $formatted_payments,
        'count' => count($formatted_payments),
        'totals' => $totals,
        'date' => $date,
        'office_id' => $office_id,
        'receptionist' => $receptionist_name
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