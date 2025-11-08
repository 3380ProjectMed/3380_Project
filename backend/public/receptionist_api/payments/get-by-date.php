<?php
/**
 * Get payments for a specific date at receptionist's office
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
    
    if (!isset($_GET['date'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'date parameter is required']);
        exit;
    }
    
    $date = $_GET['date'];
    $user_id = (int)$_SESSION['uid'];
    
    $conn = getDBConnection();
    
    // Get receptionist's office
    $rows = executeQuery($conn, '
        SELECT s.work_location as office_id
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
    
    // Get payments for this office on the specified date
    $sql = "SELECT 
                pv.visit_id,
                pv.payment,
                pv.copay_amount_due,
                pv.amount_due,
                pv.total_due,
                pv.treatment_cost_due,
                pv.last_updated as payment_date,
                pv.patient_id,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                pv.appointment_id,
                a.appointment_date,
                CONCAT(d.first_name, ' ', d.last_name) as doctor_name
            FROM patient_visit pv
            LEFT JOIN appointment a ON pv.appointment_id = a.appointment_id
            INNER JOIN patient p ON pv.patient_id = p.patient_id
            LEFT JOIN doctor d ON pv.doctor_id = d.doctor_id
            WHERE pv.office_id = ?
            AND DATE(pv.last_updated) = ?
            AND pv.payment IS NOT NULL
            ORDER BY pv.last_updated DESC";
    
    $payments = executeQuery($conn, $sql, 'is', [$office_id, $date]);
    
    $formatted_payments = [];
    $totals = [
        'cash' => 0,
        'card' => 0,
        'check' => 0,
        'insurance' => 0,
        'treatments' => 0,
        'total' => 0
    ];
    
    foreach ($payments as $payment) {
        $amount = (float)$payment['payment'];
        $copay = (float)($payment['copay_amount_due'] ?? 0);
        $treatment_cost = (float)($payment['treatment_cost_due'] ?? 0);
        
        // Calculate totals
        $totals['total'] += $amount;
        $totals['treatments'] += $treatment_cost;
        
        if ($copay > 0) {
            $insurance_portion = $amount - $copay;
            $totals['insurance'] += $insurance_portion;
            $totals['card'] += $copay;
        } else {
            $totals['card'] += $amount;
        }
        
        // Get treatment details for this visit
        $treatmentSql = "SELECT 
                            tc.name,
                            tpv.quantity,
                            tpv.cost_each,
                            tpv.total_cost
                        FROM treatment_per_visit tpv
                        LEFT JOIN treatment_catalog tc ON tpv.treatment_id = tc.treatment_id
                        WHERE tpv.visit_id = ?";
        
        $treatments = executeQuery($conn, $treatmentSql, 'i', [$payment['visit_id']]);
        
        $treatment_summary = '';
        if (!empty($treatments)) {
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
            'payment_date' => date('Y-m-d', strtotime($payment['payment_date'])),
            'payment_time' => date('g:i A', strtotime($payment['payment_date'])),
            'payment_method' => $copay > 0 ? 'Insurance + Card' : 'Card',
            'patient_id' => $payment['patient_id'],
            'patient_id_formatted' => 'P' . str_pad($payment['patient_id'], 3, '0', STR_PAD_LEFT),
            'patient_name' => $payment['patient_name'],
            'appointment_id' => $payment['appointment_id'],
            'appointment_id_formatted' => $payment['appointment_id'] ? 'A' . str_pad($payment['appointment_id'], 4, '0', STR_PAD_LEFT) : 'N/A',
            'appointment_time' => $payment['appointment_date'] ? date('g:i A', strtotime($payment['appointment_date'])) : 'N/A',
            'doctor_name' => $payment['doctor_name'],
            'treatment_summary' => $treatment_summary
        ];
    }
    
    // Format totals
    foreach ($totals as $key => $value) {
        $totals[$key] = number_format($value, 2);
    }
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'payments' => $formatted_payments,
        'count' => count($formatted_payments),
        'totals' => $totals,
        'date' => $date,
        'office_id' => $office_id
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