<?php
//financial-summary.php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {
    session_start();
    
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }
    
    $conn = getDBConnection();
    
    // Get and validate parameters
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-d', strtotime('-30 days'));
    $end_date = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d');
    $group_by = isset($_GET['group_by']) ? $_GET['group_by'] : 'day';
    $office_id = isset($_GET['office_id']) ? $_GET['office_id'] : null;
    $doctor_id = isset($_GET['doctor_id']) ? $_GET['doctor_id'] : null;
    $insurance_id = isset($_GET['insurance_id']) ? $_GET['insurance_id'] : null;
    
    // Validate inputs
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid date format. Use YYYY-MM-DD']);
        exit;
    }
    
    if (!in_array($group_by, ['day', 'week', 'month'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid group_by value. Use day, week, or month']);
        exit;
    }
    
    // Build WHERE clause for filters
    $where_conditions = ["pv.date BETWEEN ? AND ?"];
    $params = [$start_date, $end_date];
    $param_types = 'ss';
    
    if ($office_id && $office_id !== 'all') {
        $where_conditions[] = "a.Office_id = ?";
        $params[] = $office_id;
        $param_types .= 'i';
    }
    
    if ($doctor_id && $doctor_id !== 'all') {
        $where_conditions[] = "pv.Doctor_id = ?";
        $params[] = $doctor_id;
        $param_types .= 'i';
    }
    
    if ($insurance_id && $insurance_id !== 'all') {
        if ($insurance_id === 'self-pay') {
            $where_conditions[] = "pv.insurance_policy_id_used IS NULL";
        } else {
            $where_conditions[] = "ipayer.payer_id = ?";
            $params[] = $insurance_id;
            $param_types .= 'i';
        }
    }
    
    $where_clause = implode(' AND ', $where_conditions);
    
    // Determine date grouping SQL
    $date_group_sql = '';
    $date_label_sql = '';
    
    switch ($group_by) {
        case 'week':
            $date_group_sql = "YEARWEEK(pv.date, 1)";
            $date_label_sql = "CONCAT('Week ', WEEK(pv.date, 1), ' - ', YEAR(pv.date))";
            break;
        case 'month':
            $date_group_sql = "DATE_FORMAT(pv.date, '%Y-%m')";
            $date_label_sql = "DATE_FORMAT(pv.date, '%b %Y')";
            break;
        case 'day':
        default:
            $date_group_sql = "DATE(pv.date)";
            $date_label_sql = "DATE_FORMAT(pv.date, '%M %d, %Y')";
            break;
    }
    
    // Revenue breakdown by period with proper joins for filtering
    $sql = "SELECT 
                $date_group_sql AS period_group,
                $date_label_sql AS period_label,
                COUNT(*) AS total_visits,
                SUM(COALESCE(pv.copay_amount_due, 0) + COALESCE(pv.treatment_cost_due, 0)) AS gross_revenue,
                SUM(COALESCE(pv.payment, 0)) AS collected_payments,
                (
                    SUM(COALESCE(pv.copay_amount_due, 0) + COALESCE(pv.treatment_cost_due, 0))
                    - SUM(COALESCE(pv.payment, 0))
                ) AS outstanding_balance,
                COUNT(DISTINCT pv.patient_id) AS unique_patients
            FROM patient_visit pv
            LEFT JOIN Appointment a ON pv.appointment_id = a.Appointment_id
            LEFT JOIN patient_insurance pi ON pv.insurance_policy_id_used = pi.id
            LEFT JOIN insurance_plan ip ON pi.plan_id = ip.plan_id
            LEFT JOIN insurance_payer ipayer ON ip.payer_id = ipayer.payer_id
            WHERE $where_clause
            GROUP BY period_group, period_label
            ORDER BY period_group DESC";
    
    $daily_revenue = executeQuery($conn, $sql, $param_types, $params);
    
    // Revenue by insurance with filters
    $insurance_where = $where_clause;
    $insurance_params = $params;
    $insurance_types = $param_types;
    
    $sql = "SELECT
                COALESCE(ipayer.name, 'Self-Pay') AS insurance_company,
                COALESCE(ip.plan_name, 'N/A') AS plan_name,
                COUNT(*) AS visit_count,
                SUM(COALESCE(pv.payment, 0)) AS total_payments,
                SUM(
                    COALESCE(pv.copay_amount_due, 0) 
                    + COALESCE(pv.treatment_cost_due, 0)
                ) AS total_cost,
                (
                    SUM(COALESCE(pv.copay_amount_due, 0) + COALESCE(pv.treatment_cost_due, 0))
                    - SUM(COALESCE(pv.payment, 0))
                ) AS outstanding
            FROM patient_visit pv
            LEFT JOIN Appointment a ON pv.appointment_id = a.Appointment_id
            LEFT JOIN patient_insurance pi ON pv.insurance_policy_id_used = pi.id
            LEFT JOIN insurance_plan ip ON pi.plan_id = ip.plan_id
            LEFT JOIN insurance_payer ipayer ON ip.payer_id = ipayer.payer_id
            WHERE $insurance_where
            GROUP BY ipayer.name, ip.plan_name
            ORDER BY total_payments DESC";
    
    $insurance_breakdown = executeQuery($conn, $sql, $insurance_types, $insurance_params);
    
    // Doctor performance breakdown (if not filtered by specific doctor)
    $doctor_performance = [];
    if (!$doctor_id || $doctor_id === 'all') {
        $sql = "SELECT
                    CONCAT(s.first_name, ' ', s.last_name) AS doctor_name,
                    d.specialty,
                    COUNT(*) AS total_visits,
                    SUM(
                        COALESCE(pv.copay_amount_due, 0) 
                        + COALESCE(pv.treatment_cost_due, 0)
                    ) AS total_revenue,
                    SUM(COALESCE(pv.payment, 0)) AS collected,
                    ROUND(
                        SUM(COALESCE(pv.copay_amount_due, 0) + COALESCE(pv.treatment_cost_due, 0)) 
                        / COUNT(*), 
                        2
                    ) AS avg_per_visit,
                    COUNT(DISTINCT pv.patient_id) AS unique_patients
                FROM patient_visit pv
                JOIN doctor d ON pv.doctor_id = d.doctor_id
                LEFT JOIN Appointment a ON pv.appointment_id = a.Appointment_id
                LEFT JOIN patient_insurance pi ON pv.insurance_policy_id_used = pi.id
                LEFT JOIN insurance_plan ip ON pi.plan_id = ip.plan_id
                LEFT JOIN insurance_payer ipayer ON ip.payer_id = ipayer.payer_id
                LEFT JOIN staff s ON d.staff_id = s.staff_id
                WHERE $where_clause
                GROUP BY d.doctor_id, s.first_name, s.last_name, d.specialty
                HAVING total_visits > 0
                ORDER BY total_revenue DESC
                LIMIT 20";
        
        $doctor_performance = executeQuery($conn, $sql, $param_types, $params);
    }
    
    // Summary totals with collection rate
    $sql = "SELECT 
                COUNT(*) AS total_visits,
                SUM(
                    COALESCE(pv.copay_amount_due, 0) 
                    + COALESCE(pv.treatment_cost_due, 0)
                ) AS total_revenue,
                SUM(COALESCE(pv.payment, 0)) AS total_collected,
                (
                    SUM(COALESCE(pv.copay_amount_due, 0) + COALESCE(pv.treatment_cost_due, 0))
                    - SUM(COALESCE(pv.payment, 0))
                ) AS total_outstanding,
                COUNT(DISTINCT pv.patient_id) AS unique_patients,
                ROUND(
                    SUM(COALESCE(pv.payment, 0)) * 100.0 / 
                    NULLIF(SUM(COALESCE(pv.copay_amount_due, 0) + COALESCE(pv.treatment_cost_due, 0)), 0),
                    1
                ) AS collection_rate,
                COUNT(DISTINCT CASE 
                    WHEN (COALESCE(pv.copay_amount_due, 0) + COALESCE(pv.treatment_cost_due, 0) - COALESCE(pv.payment, 0)) > 0 
                    THEN pv.visit_id 
                END) AS outstanding_visits,
                ROUND(
                    SUM(COALESCE(pv.copay_amount_due, 0) + COALESCE(pv.treatment_cost_due, 0)) / 
                    NULLIF(COUNT(DISTINCT pv.patient_id), 0),
                    2
                ) AS avg_revenue_per_patient
            FROM patient_visit pv
            LEFT JOIN Appointment a ON pv.appointment_id = a.Appointment_id
            LEFT JOIN patient_insurance pi ON pv.insurance_policy_id_used = pi.id
            LEFT JOIN insurance_plan ip ON pi.plan_id = ip.plan_id
            LEFT JOIN insurance_payer ipayer ON ip.payer_id = ipayer.payer_id
            WHERE $where_clause";
    
    $summary_result = executeQuery($conn, $sql, $param_types, $params);
    $summary = $summary_result[0] ?? [
        'total_visits' => 0,
        'total_revenue' => 0,
        'total_collected' => 0,
        'total_outstanding' => 0,
        'unique_patients' => 0,
        'collection_rate' => 0,
        'outstanding_visits' => 0,
        'avg_revenue_per_patient' => 0
    ];
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'start_date' => $start_date,
        'end_date' => $end_date,
        'group_by' => $group_by,
        'filters' => [
            'office_id' => $office_id,
            'doctor_id' => $doctor_id,
            'insurance_id' => $insurance_id
        ],
        'summary' => $summary,
        'daily_revenue' => $daily_revenue,
        'insurance_breakdown' => $insurance_breakdown,
        'doctor_performance' => $doctor_performance
    ], JSON_NUMERIC_CHECK);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>