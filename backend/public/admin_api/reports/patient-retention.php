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
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-d', strtotime('-90 days'));
    $end_date   = isset($_GET['end_date'])   ? $_GET['end_date']   : date('Y-m-d');
    $doctor_id  = !empty($_GET['doctor_id']) && $_GET['doctor_id'] !== 'all' ? (int)$_GET['doctor_id'] : null;

    // ---- Patient Retention Analysis ----
    // This identifies new patients in the period and tracks if they returned
    $sql = "
        SELECT
            p.patient_id,
            CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
            first_appt.first_visit_date,
            CONCAT(s.first_name, ' ', s.last_name) AS first_doctor,
            
            -- Count total appointments for this patient
            COUNT(DISTINCT a.Appointment_id) AS total_appointments,
            
            -- Count return visits (appointments after first visit)
            COUNT(DISTINCT CASE 
                WHEN a.Appointment_date > first_appt.first_visit_date 
                AND a.Status NOT IN ('Cancelled', 'No-Show')
                THEN a.Appointment_id 
            END) AS return_visits,
            
            -- Last appointment date
            MAX(a.Appointment_date) AS last_appointment_date,
            
            -- Days since first visit
            DATEDIFF(CURDATE(), first_appt.first_visit_date) AS days_since_first_visit,
            
            -- Retention status
            CASE
                WHEN COUNT(DISTINCT CASE 
                    WHEN a.Appointment_date > first_appt.first_visit_date 
                    THEN a.Appointment_id 
                END) > 0 THEN 'Retained'
                WHEN DATEDIFF(CURDATE(), first_appt.first_visit_date) < 30 THEN 'New (< 30 days)'
                ELSE 'At Risk'
            END AS retention_status
            
        FROM (
            -- Subquery to get each patient's first visit in the date range
            SELECT 
                a1.Patient_id,
                MIN(a1.Appointment_date) AS first_visit_date,
                (SELECT a2.Doctor_id 
                 FROM appointment a2 
                 WHERE a2.Patient_id = a1.Patient_id 
                 ORDER BY a2.Appointment_date 
                 LIMIT 1) AS first_doctor_id
            FROM appointment a1
            WHERE a1.Status NOT IN ('Cancelled', 'No-Show')
              AND a1.Appointment_date BETWEEN ? AND ?
              AND a1.Appointment_date = (
                  SELECT MIN(a3.Appointment_date)
                  FROM appointment a3
                  WHERE a3.Patient_id = a1.Patient_id
                    AND a3.Status NOT IN ('Cancelled', 'No-Show')
              )
            GROUP BY a1.Patient_id
        ) first_appt
        JOIN patient p ON p.patient_id = first_appt.Patient_id
        JOIN doctor d ON d.doctor_id = first_appt.first_doctor_id
        JOIN staff s ON s.staff_id = d.staff_id
        LEFT JOIN appointment a ON a.Patient_id = p.patient_id
            AND a.Status NOT IN ('Cancelled', 'No-Show')
        WHERE 1=1
    ";

    $types = 'ss';
    $params = [$start_date . ' 00:00:00', $end_date . ' 23:59:59'];

    if ($doctor_id !== null) {
        $sql .= " AND first_appt.first_doctor_id = ?";
        $types .= 'i';
        $params[] = $doctor_id;
    }

    $sql .= "
        GROUP BY p.patient_id, patient_name, first_appt.first_visit_date, first_doctor
        ORDER BY first_appt.first_visit_date DESC
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
    $patients = $result->fetch_all(MYSQLI_ASSOC);

    // ---- Calculate Summary ----
    $total_new_patients = count($patients);
    $retained_count = 0;
    $at_risk_count = 0;
    $new_count = 0;
    $total_return_visits = 0;

    foreach ($patients as $pt) {
        $total_return_visits += (int)$pt['return_visits'];

        if ($pt['retention_status'] === 'Retained') {
            $retained_count++;
        } elseif ($pt['retention_status'] === 'At Risk') {
            $at_risk_count++;
        } else {
            $new_count++;
        }
    }

    $retention_rate = $total_new_patients > 0
        ? round(($retained_count / $total_new_patients) * 100, 1)
        : 0;

    $avg_return_visits = $retained_count > 0
        ? round($total_return_visits / $retained_count, 1)
        : 0;

    $summary = [
        'total_new_patients' => $total_new_patients,
        'retained_patients' => $retained_count,
        'at_risk_patients' => $at_risk_count,
        'very_new_patients' => $new_count,
        'retention_rate' => $retention_rate,
        'avg_return_visits_per_retained_patient' => $avg_return_visits,
    ];

    echo json_encode([
        'success' => true,
        'summary' => $summary,
        'patients' => $patients
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
