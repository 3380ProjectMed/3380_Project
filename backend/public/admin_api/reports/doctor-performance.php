<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

header('Content-Type: application/json');

try {
    session_start();

    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    $conn = getDBConnection();

    // Get parameters
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-d', strtotime('-30 days'));
    $end_date   = isset($_GET['end_date'])   ? $_GET['end_date']   : date('Y-m-d');
    $office_id  = !empty($_GET['office_id']) && $_GET['office_id'] !== 'all' ? (int)$_GET['office_id'] : null;

    // ---- Doctor Performance Summary ----
    $sql = "
        SELECT
            d.doctor_id,
            CONCAT(s.first_name, ' ', s.last_name) AS doctor_name,
            sp.specialty_name,
            o.name AS primary_office,
            
            -- Appointment metrics
            COUNT(DISTINCT a.Appointment_id) AS total_appointments,
            COUNT(DISTINCT CASE WHEN a.Status = 'Completed' THEN a.Appointment_id END) AS completed_appointments,
            COUNT(DISTINCT CASE WHEN a.Status = 'Scheduled' THEN a.Appointment_id END) AS scheduled_appointments,
            COUNT(DISTINCT CASE WHEN a.Status = 'No-Show' THEN a.Appointment_id END) AS no_shows,
            COUNT(DISTINCT CASE WHEN a.Status = 'Cancelled' THEN a.Appointment_id END) AS cancelled,
            
            -- Patient metrics
            COUNT(DISTINCT a.Patient_id) AS unique_patients_seen,
            
            -- New patients (first-time to this specific doctor)
            COUNT(DISTINCT CASE 
                WHEN a.Appointment_date = (
                    SELECT MIN(a2.Appointment_date)
                    FROM appointment a2
                    WHERE a2.Patient_id = a.Patient_id
                      AND a2.Doctor_id = d.doctor_id
                      AND a2.Status NOT IN ('Cancelled', 'No-Show')
                )
                THEN a.Patient_id 
            END) AS new_patients_to_doctor,
            
            -- Revenue metrics (from patient_visit)
            COALESCE(SUM(pv.treatment_cost_due), 0) AS total_revenue,
            COALESCE(SUM(pv.payment), 0) AS total_collected,
            COALESCE(SUM(pv.treatment_cost_due) - SUM(pv.payment), 0) AS outstanding_balance,
            
            -- Average metrics
            ROUND(AVG(CASE WHEN pv.treatment_cost_due > 0 THEN pv.treatment_cost_due END), 2) AS avg_revenue_per_visit,
            ROUND(
                COUNT(DISTINCT CASE WHEN a.Status = 'Completed' THEN a.Appointment_id END) / 
                NULLIF(DATEDIFF(?, ?), 0),
                2
            ) AS avg_appointments_per_day,
            
            -- No-show rate
            ROUND(
                (COUNT(DISTINCT CASE WHEN a.Status = 'No-Show' THEN a.Appointment_id END) * 100.0) / 
                NULLIF(COUNT(DISTINCT a.Appointment_id), 0),
                1
            ) AS no_show_rate,
            
            -- Completion rate
            ROUND(
                (COUNT(DISTINCT CASE WHEN a.Status = 'Completed' THEN a.Appointment_id END) * 100.0) / 
                NULLIF(COUNT(DISTINCT a.Appointment_id), 0),
                1
            ) AS completion_rate
            
        FROM doctor d
        JOIN staff s ON s.staff_id = d.staff_id
        JOIN specialty sp ON sp.specialty_id = d.specialty
        LEFT JOIN office o ON o.office_id = s.work_location
        LEFT JOIN appointment a ON a.Doctor_id = d.doctor_id
            AND a.Appointment_date BETWEEN ? AND ?
        LEFT JOIN patient_visit pv ON pv.appointment_id = a.Appointment_id
            AND pv.status = 'Completed'
        WHERE 1=1
    ";

    $types = 'ssss';
    $params = [$end_date, $start_date, $start_date . ' 00:00:00', $end_date . ' 23:59:59'];

    if ($office_id !== null) {
        $sql .= " AND s.work_location = ?";
        $types .= 'i';
        $params[] = $office_id;
    }

    $sql .= "
        GROUP BY d.doctor_id, doctor_name, sp.specialty_name, o.name
        ORDER BY total_appointments DESC
    ";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }

    $refs = [];
    $bindParams = array_merge([$types], $params);
    foreach ($bindParams as $k => $v) {
        $refs[$k] = &$bindParams[$k];
    }
    call_user_func_array([$stmt, 'bind_param'], $refs);

    if (!$stmt->execute()) {
        throw new Exception('Execute failed: ' . $stmt->error);
    }

    $result = $stmt->get_result();
    $doctors = $result->fetch_all(MYSQLI_ASSOC);

    // ---- Calculate Summary Totals ----
    $summary = [
        'total_doctors' => count($doctors),
        'total_appointments' => 0,
        'total_completed' => 0,
        'total_patients' => 0,
        'total_revenue' => 0,
        'total_collected' => 0,
        'avg_no_show_rate' => 0,
        'avg_completion_rate' => 0,
    ];

    foreach ($doctors as $doc) {
        $summary['total_appointments'] += (int)$doc['total_appointments'];
        $summary['total_completed'] += (int)$doc['completed_appointments'];
        $summary['total_patients'] += (int)$doc['unique_patients_seen'];
        $summary['total_revenue'] += (float)$doc['total_revenue'];
        $summary['total_collected'] += (float)$doc['total_collected'];
    }

    if (count($doctors) > 0) {
        $summary['avg_no_show_rate'] = round(
            array_sum(array_column($doctors, 'no_show_rate')) / count($doctors),
            1
        );
        $summary['avg_completion_rate'] = round(
            array_sum(array_column($doctors, 'completion_rate')) / count($doctors),
            1
        );
    }

    echo json_encode([
        'success' => true,
        'summary' => $summary,
        'doctors' => $doctors
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
