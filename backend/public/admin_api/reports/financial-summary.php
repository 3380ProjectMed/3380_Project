<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
try {
    session_start();
    
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }
    
    $conn = getDBConnection();
    
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-d', strtotime('-30 days'));
    $end_date = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d');
    
    // Daily revenue breakdown
    $sql = "SELECT 
                DATE(pv.date) as visit_date,
                COUNT(*) as total_visits,
                SUM(pv.copay_amount_due) as gross_revenue,
                SUM(pv.payment) as collected_payments,
                SUM(pv.treatment_cost_due) as outstanding_balance,
                COUNT(DISTINCT pv.patient_id) as unique_patients
            FROM patient_visit pv
            WHERE pv.date BETWEEN ? AND ?
            GROUP BY DATE(pv.date)
            ORDER BY visit_date DESC";
    
    $daily_revenue = executeQuery($conn, $sql, 'ss', [$start_date, $end_date]);
    
    // Revenue by insurance
    $sql = "SELECT 
                ipayer.name as insurance_company,
                ip.plan_name,
                COUNT(*) as visit_count,
                SUM(pv.payment) as total_payments,
                SUM(pv.total_due) as outstanding
            FROM patient_visit pv
            LEFT JOIN patient_insurance pi ON pv.insurance_policy_id_used = pi.id
            LEFT JOIN insurance_plan ip ON pi.plan_id = ip.plan_id
            LEFT JOIN insurance_payer ipayer ON ip.payer_id = ipayer.payer_id
            WHERE pv.date BETWEEN ? AND ?
            GROUP BY ipayer.name, ip.plan_name
            ORDER BY total_payments DESC";
    
    $insurance_breakdown = executeQuery($conn, $sql, 'ss', [$start_date, $end_date]);
    
    // Summary totals
    $sql = "SELECT 
                COUNT(*) as total_visits,
                SUM(amount_due) as total_revenue,
                SUM(payment) as total_collected,
                SUM(total_due) as total_outstanding
            FROM patient_visit
            WHERE date BETWEEN ? AND ?";
    
    $summary = executeQuery($conn, $sql, 'ss', [$start_date, $end_date]);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'start_date' => $start_date,
        'end_date' => $end_date,
        'summary' => $summary[0],
        'daily_revenue' => $daily_revenue,
        'insurance_breakdown' => $insurance_breakdown
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>