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

    // ---- Get new patients in date range ----
    $new_patients_sql = "
        SELECT DISTINCT a.Patient_id
        FROM appointment a
        WHERE a.Status NOT IN ('Cancelled', 'No-Show')
          AND a.Appointment_date BETWEEN ? AND ?
          AND a.Appointment_date = (
              SELECT MIN(a2.Appointment_date)
              FROM appointment a2
              WHERE a2.Patient_id = a.Patient_id
                AND a2.Status NOT IN ('Cancelled', 'No-Show')
          )
    ";

    // ---- Age Distribution ----
    $age_sql = "
        SELECT
            CASE
                WHEN TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) < 18 THEN 'Under 18'
                WHEN TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) BETWEEN 18 AND 30 THEN '18-30'
                WHEN TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) BETWEEN 31 AND 45 THEN '31-45'
                WHEN TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) BETWEEN 46 AND 60 THEN '46-60'
                WHEN TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) > 60 THEN 'Over 60'
            END AS age_group,
            COUNT(*) AS patient_count,
            ROUND(AVG(TIMESTAMPDIFF(YEAR, p.dob, CURDATE())), 1) AS avg_age
        FROM patient p
        WHERE p.patient_id IN ($new_patients_sql)
        GROUP BY age_group
        ORDER BY 
            CASE age_group
                WHEN 'Under 18' THEN 1
                WHEN '18-30' THEN 2
                WHEN '31-45' THEN 3
                WHEN '46-60' THEN 4
                WHEN 'Over 60' THEN 5
            END
    ";

    $stmt = $conn->prepare($age_sql);
    $stmt->bind_param('ss', $start_date, $end_date);
    $stmt->execute();
    $age_distribution = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // ---- Gender Distribution ----
    $gender_sql = "
        SELECT
            cg.gender_text,
            COUNT(*) AS patient_count
        FROM patient p
        JOIN codes_gender cg ON cg.gender_code = p.gender
        WHERE p.patient_id IN ($new_patients_sql)
        GROUP BY cg.gender_text
        ORDER BY patient_count DESC
    ";

    $stmt = $conn->prepare($gender_sql);
    $stmt->bind_param('ss', $start_date, $end_date);
    $stmt->execute();
    $gender_distribution = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // ---- Ethnicity Distribution ----
    $ethnicity_sql = "
        SELECT
            ce.ethnicity_text,
            COUNT(*) AS patient_count
        FROM patient p
        JOIN codes_ethnicity ce ON ce.ethnicity_code = p.ethnicity
        WHERE p.patient_id IN ($new_patients_sql)
        GROUP BY ce.ethnicity_text
        ORDER BY patient_count DESC
    ";

    $stmt = $conn->prepare($ethnicity_sql);
    $stmt->bind_param('ss', $start_date, $end_date);
    $stmt->execute();
    $ethnicity_distribution = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // ---- Race Distribution ----
    $race_sql = "
        SELECT
            cr.race_text,
            COUNT(*) AS patient_count
        FROM patient p
        JOIN codes_race cr ON cr.race_code = p.race
        WHERE p.patient_id IN ($new_patients_sql)
        GROUP BY cr.race_text
        ORDER BY patient_count DESC
    ";

    $stmt = $conn->prepare($race_sql);
    $stmt->bind_param('ss', $start_date, $end_date);
    $stmt->execute();
    $race_distribution = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // ---- Insurance Type Distribution ----
    $insurance_sql = "
        SELECT
            ip.payer_type,
            iplan.plan_type,
            ipayer.name AS insurance_company,
            COUNT(DISTINCT p.patient_id) AS patient_count
        FROM patient p
        LEFT JOIN patient_insurance pi ON pi.patient_id = p.patient_id AND pi.is_primary = 1
        LEFT JOIN insurance_plan iplan ON iplan.plan_id = pi.plan_id
        LEFT JOIN insurance_payer ipayer ON ipayer.payer_id = iplan.payer_id
        WHERE p.patient_id IN ($new_patients_sql)
        GROUP BY ip.payer_type, iplan.plan_type, ipayer.name
        ORDER BY patient_count DESC
    ";

    $stmt = $conn->prepare($insurance_sql);
    $stmt->bind_param('ss', $start_date, $end_date);
    $stmt->execute();
    $insurance_distribution = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // ---- Blood Type Distribution (if useful) ----
    $blood_sql = "
        SELECT
            p.blood_type,
            COUNT(*) AS patient_count
        FROM patient p
        WHERE p.patient_id IN ($new_patients_sql)
          AND p.blood_type IS NOT NULL
        GROUP BY p.blood_type
        ORDER BY patient_count DESC
    ";

    $stmt = $conn->prepare($blood_sql);
    $stmt->bind_param('ss', $start_date, $end_date);
    $stmt->execute();
    $blood_distribution = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // ---- Total count ----
    $total_sql = "
        SELECT COUNT(DISTINCT a.Patient_id) AS total_new_patients
        FROM appointment a
        WHERE a.Status NOT IN ('Cancelled', 'No-Show')
          AND a.Appointment_date BETWEEN ? AND ?
          AND a.Appointment_date = (
              SELECT MIN(a2.Appointment_date)
              FROM appointment a2
              WHERE a2.Patient_id = a.Patient_id
                AND a2.Status NOT IN ('Cancelled', 'No-Show')
          )
    ";

    $stmt = $conn->prepare($total_sql);
    $stmt->bind_param('ss', $start_date, $end_date);
    $stmt->execute();
    $total_result = $stmt->get_result()->fetch_assoc();

    echo json_encode([
        'success' => true,
        'total_new_patients' => $total_result['total_new_patients'],
        'age_distribution' => $age_distribution,
        'gender_distribution' => $gender_distribution,
        'ethnicity_distribution' => $ethnicity_distribution,
        'race_distribution' => $race_distribution,
        'insurance_distribution' => $insurance_distribution,
        'blood_type_distribution' => $blood_distribution,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
