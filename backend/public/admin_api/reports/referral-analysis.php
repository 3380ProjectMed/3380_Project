<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
header('Content-Type: application/json');

try {
    //session_start();

    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    $conn = getDBConnection();

    // Get parameters
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-d', strtotime('-30 days'));
    $end_date   = isset($_GET['end_date'])   ? $_GET['end_date']   : date('Y-m-d');

    // ---- Referral Patterns Analysis ----
    $sql = "
        SELECT
            -- Referring doctor info
            ref_d.doctor_id AS referring_doctor_id,
            CONCAT(ref_s.first_name, ' ', ref_s.last_name) AS referring_doctor_name,
            ref_sp.specialty_name AS referring_specialty,
            
            -- Specialist doctor info
            spec_d.doctor_id AS specialist_doctor_id,
            CONCAT(spec_s.first_name, ' ', spec_s.last_name) AS specialist_doctor_name,
            spec_sp.specialty_name AS specialist_specialty,
            
            -- Referral metrics
            COUNT(*) AS total_referrals,
            COUNT(CASE WHEN r.date_of_approval IS NOT NULL THEN 1 END) AS approved_referrals,
            COUNT(CASE WHEN r.date_of_approval IS NULL THEN 1 END) AS pending_referrals,
            COUNT(CASE WHEN r.appointment_id IS NOT NULL THEN 1 END) AS referrals_with_appointments,
            
            -- Completion rate
            ROUND(
                (COUNT(CASE WHEN r.appointment_id IS NOT NULL THEN 1 END) * 100.0) / 
                NULLIF(COUNT(CASE WHEN r.date_of_approval IS NOT NULL THEN 1 END), 0),
                1
            ) AS appointment_completion_rate,
            
            -- Most common reasons (comma-separated)
            GROUP_CONCAT(DISTINCT r.reason SEPARATOR '; ') AS common_reasons
            
        FROM referral r
        LEFT JOIN doctor ref_d ON ref_d.doctor_id = r.referring_doctor_staff_id
        LEFT JOIN staff ref_s ON ref_s.staff_id = ref_d.staff_id
        LEFT JOIN specialty ref_sp ON ref_sp.specialty_id = ref_d.specialty
        
        LEFT JOIN doctor spec_d ON spec_d.doctor_id = r.specialist_doctor_staff_id
        LEFT JOIN staff spec_s ON spec_s.staff_id = spec_d.staff_id
        LEFT JOIN specialty spec_sp ON spec_sp.specialty_id = spec_d.specialty
        
        LEFT JOIN appointment a ON a.Appointment_id = r.appointment_id
        
        WHERE (r.date_of_approval BETWEEN ? AND ? 
               OR (r.date_of_approval IS NULL AND a.Date_created BETWEEN ? AND ?))
        
        GROUP BY 
            ref_d.doctor_id, referring_doctor_name, referring_specialty,
            spec_d.doctor_id, specialist_doctor_name, specialist_specialty
        
        ORDER BY total_referrals DESC
    ";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }

    $params = [
        $start_date . ' 00:00:00',
        $end_date . ' 23:59:59',
        $start_date . ' 00:00:00',
        $end_date . ' 23:59:59'
    ];

    $stmt->bind_param('ssss', ...$params);

    if (!$stmt->execute()) {
        throw new Exception('Execute failed: ' . $stmt->error);
    }

    $result = $stmt->get_result();
    $referral_patterns = $result->fetch_all(MYSQLI_ASSOC);

    // ---- Top Referring Doctors ----
    $sql2 = "
        SELECT
            ref_d.doctor_id,
            CONCAT(ref_s.first_name, ' ', ref_s.last_name) AS doctor_name,
            ref_sp.specialty_name,
            COUNT(*) AS total_referrals_made,
            COUNT(CASE WHEN r.date_of_approval IS NOT NULL THEN 1 END) AS approved,
            COUNT(CASE WHEN r.appointment_id IS NOT NULL THEN 1 END) AS completed
        FROM referral r
        JOIN doctor ref_d ON ref_d.doctor_id = r.referring_doctor_staff_id
        JOIN staff ref_s ON ref_s.staff_id = ref_d.staff_id
        JOIN specialty ref_sp ON ref_sp.specialty_id = ref_d.specialty
        WHERE r.date_of_approval BETWEEN ? AND ?
           OR (r.date_of_approval IS NULL AND EXISTS (
               SELECT 1 FROM appointment a 
               WHERE a.Appointment_id = r.appointment_id 
               AND a.Date_created BETWEEN ? AND ?
           ))
        GROUP BY ref_d.doctor_id, doctor_name, ref_sp.specialty_name
        ORDER BY total_referrals_made DESC
        LIMIT 10
    ";

    $stmt2 = $conn->prepare($sql2);
    $stmt2->bind_param('ssss', ...$params);
    $stmt2->execute();
    $result2 = $stmt2->get_result();
    $top_referring_doctors = $result2->fetch_all(MYSQLI_ASSOC);

    // ---- Top Specialists Receiving Referrals ----
    $sql3 = "
        SELECT
            spec_d.doctor_id,
            CONCAT(spec_s.first_name, ' ', spec_s.last_name) AS doctor_name,
            spec_sp.specialty_name,
            COUNT(*) AS total_referrals_received,
            COUNT(CASE WHEN r.date_of_approval IS NOT NULL THEN 1 END) AS approved,
            COUNT(CASE WHEN r.appointment_id IS NOT NULL THEN 1 END) AS appointments_booked
        FROM referral r
        JOIN doctor spec_d ON spec_d.doctor_id = r.specialist_doctor_staff_id
        JOIN staff spec_s ON spec_s.staff_id = spec_d.staff_id
        JOIN specialty spec_sp ON spec_sp.specialty_id = spec_d.specialty
        WHERE r.date_of_approval BETWEEN ? AND ?
           OR (r.date_of_approval IS NULL AND EXISTS (
               SELECT 1 FROM appointment a 
               WHERE a.Appointment_id = r.appointment_id 
               AND a.Date_created BETWEEN ? AND ?
           ))
        GROUP BY spec_d.doctor_id, doctor_name, spec_sp.specialty_name
        ORDER BY total_referrals_received DESC
        LIMIT 10
    ";

    $stmt3 = $conn->prepare($sql3);
    $stmt3->bind_param('ssss', ...$params);
    $stmt3->execute();
    $result3 = $stmt3->get_result();
    $top_specialists = $result3->fetch_all(MYSQLI_ASSOC);

    // ---- Calculate Summary ----
    $total_referrals = 0;
    $total_approved = 0;
    $total_pending = 0;
    $total_with_appts = 0;

    foreach ($referral_patterns as $pattern) {
        $total_referrals += (int)$pattern['total_referrals'];
        $total_approved += (int)$pattern['approved_referrals'];
        $total_pending += (int)$pattern['pending_referrals'];
        $total_with_appts += (int)$pattern['referrals_with_appointments'];
    }

    $summary = [
        'total_referrals' => $total_referrals,
        'approved_referrals' => $total_approved,
        'pending_referrals' => $total_pending,
        'referrals_with_appointments' => $total_with_appts,
        'overall_completion_rate' => $total_approved > 0
            ? round(($total_with_appts / $total_approved) * 100, 1)
            : 0,
    ];

    echo json_encode([
        'success' => true,
        'summary' => $summary,
        'referral_patterns' => $referral_patterns,
        'top_referring_doctors' => $top_referring_doctors,
        'top_specialists' => $top_specialists,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
