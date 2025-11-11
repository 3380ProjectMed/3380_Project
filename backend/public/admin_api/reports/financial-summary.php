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
                DATE(pv.date) AS visit_date,
                COUNT(*) AS total_visits,
                SUM(COALESCE(pv.copay_amount_due,0) + COALESCE(pv.treatment_cost_due,0)) AS gross_revenue,
                SUM(COALESCE(pv.payment,0)) AS collected_payments,
                (
                    SUM(COALESCE(pv.copay_amount_due,0) + COALESCE(pv.treatment_cost_due,0))
                    - SUM(COALESCE(pv.payment,0))
                ) AS outstanding_balance,
                COUNT(DISTINCT pv.patient_id) AS unique_patients
            FROM patient_visit pv
            WHERE pv.date BETWEEN ? AND ?
            GROUP BY DATE(pv.date)
            ORDER BY visit_date DESC";
    
    $daily_revenue = executeQuery($conn, $sql, 'ss', [$start_date, $end_date]);
    
    // Revenue by insurance
    $sql = "SELECT
                t.insurance_company,
                t.plan_name,
                t.visit_count,
                t.total_payments,
                t.total_cost,
                (t.total_cost - t.total_payments) AS total_due
            FROM (
                SELECT 
                    ipayer.name AS insurance_company,
                    ip.plan_name,
                    COUNT(*) AS visit_count,
                    SUM(COALESCE(pv.payment, 0)) AS total_payments,
                    SUM(
                        COALESCE(pv.copay_amount_due, 0) 
                        + COALESCE(pv.treatment_cost_due, 0) * COALESCE(ip.coinsurance_rate, 0)
                    ) AS total_cost
                FROM patient_visit pv
                LEFT JOIN patient_insurance pi 
                    ON pv.insurance_policy_id_used = pi.id
                LEFT JOIN insurance_plan ip 
                    ON pi.plan_id = ip.plan_id
                LEFT JOIN insurance_payer ipayer 
                    ON ip.payer_id = ipayer.payer_id
                WHERE pv.date BETWEEN ? AND ?
                GROUP BY ipayer.name, ip.plan_name
            ) AS t
            ORDER BY t.total_payments DESC;
            ";
    
    $insurance_breakdown = executeQuery($conn, $sql, 'ss', [$start_date, $end_date]);
    
    // Summary totals
    $sql = "SELECT 
                COUNT(*) AS total_visits,
                SUM(
                    COALESCE(copay_amount_due, 0) 
                    + COALESCE(treatment_cost_due, 0)
                ) AS total_revenue,
                SUM(COALESCE(payment, 0)) AS total_collected,
                (
                    SUM(
                        COALESCE(copay_amount_due, 0) 
                        + COALESCE(treatment_cost_due, 0)
                    ) 
                    - SUM(COALESCE(payment, 0))
                ) AS total_due
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