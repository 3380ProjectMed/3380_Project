<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_log("=== Doctor Appointment Report API Called ===");

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    header('Content-Type: application/json; charset=utf-8');


    if (!function_exists('getDBConnection')) {
        throw new Exception('Database helper functions not loaded');
    }

    if (!isset($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $conn = getDBConnection();
    if (!$conn) {
        throw new Exception('Database connection failed');
    }

    $user_id = intval($_SESSION['uid']);

    $userQuery = "SELECT ua.role, d.doctor_id 
              FROM user_account ua 
              LEFT JOIN staff s ON ua.user_id = s.staff_id
              LEFT JOIN doctor d ON s.staff_id = d.staff_id
              WHERE ua.user_id = ? 
              LIMIT 1";
    $userInfo = executeQuery($conn, $userQuery, 'i', [$user_id]);

    if (!is_array($userInfo) || count($userInfo) === 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        closeDBConnection($conn);
        exit;
    }

    $userRole = $userInfo[0]['role'];
    $loggedInDoctorId = $userInfo[0]['doctor_id'];

    if (!in_array($userRole, ['DOCTOR', 'ADMIN'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied. Only doctors and admins can access reports.']);
        closeDBConnection($conn);
        exit;
    }

    $whereConditions = [];
    $params = [];
    $types = '';

    $startDate = isset($_GET['StartDate']) ? $_GET['StartDate'] : date('Y-m-01');
    $endDate = isset($_GET['EndDate']) ? $_GET['EndDate'] : date('Y-m-t');

    $whereConditions[] = "DATE(a.Appointment_date) BETWEEN ? AND ?";
    $params[] = $startDate;
    $params[] = $endDate;
    $types .= 'ss';

    if ($userRole === 'DOCTOR') {
        if ($loggedInDoctorId === null) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'No doctor profile found for this user']);
            closeDBConnection($conn);
            exit;
        }
        $whereConditions[] = "a.Doctor_id = ?";
        $params[] = $loggedInDoctorId;
        $types .= 'i';
    } elseif ($userRole === 'ADMIN' && isset($_GET['DoctorID']) && $_GET['DoctorID'] !== '' && $_GET['DoctorID'] !== 'all') {
        $whereConditions[] = "a.Doctor_id = ?";
        $params[] = intval($_GET['DoctorID']);
        $types .= 'i';
    }

    if (isset($_GET['OfficeID']) && $_GET['OfficeID'] !== '' && $_GET['OfficeID'] !== 'all') {
        $whereConditions[] = "a.Office_id = ?";
        $params[] = intval($_GET['OfficeID']);
        $types .= 'i';
    }

    if (isset($_GET['Status']) && $_GET['Status'] !== '' && $_GET['Status'] !== 'all') {
        $whereConditions[] = "pv.status = ?";
        $params[] = $_GET['Status'];
        $types .= 's';
    }

    if (isset($_GET['PatientID']) && $_GET['PatientID'] !== '' && $_GET['PatientID'] !== 'all') {
        $whereConditions[] = "a.Patient_id = ?";
        $params[] = intval($_GET['PatientID']);
        $types .= 'i';
    }

    if (isset($_GET['VisitReason']) && $_GET['VisitReason'] !== '') {
        $whereConditions[] = "a.Reason_for_visit LIKE ?";
        $params[] = '%' . $_GET['VisitReason'] . '%';
        $types .= 's';
    }

    if (isset($_GET['NurseID']) && $_GET['NurseID'] !== '' && $_GET['NurseID'] !== 'all') {
        $whereConditions[] = "pv.nurse_id = ?";
        $params[] = intval($_GET['NurseID']);
        $types .= 'i';
    }

    $whereClause = count($whereConditions) > 0 ? 'WHERE ' . implode(' AND ', $whereConditions) : '';


    $sql = "SELECT 
        a.Appointment_id as appointment_id,
        DATE(a.Appointment_date) as appointment_date,
        DATE_FORMAT(a.Appointment_date, '%H:%i') as appointment_time,
        DATE_FORMAT(a.Appointment_date, '%W') as day_of_week,
        a.Date_created as date_created,
        a.Reason_for_visit as reason,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.patient_id as patient_id,
        p.dob as patient_dob,
        TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) as patient_age,
        cg.gender_text as patient_gender,
        CONCAT(doc_staff.first_name, ' ', doc_staff.last_name) as doctor_name,
        d.doctor_id as doctor_id,
        s.specialty_name as doctor_specialty,
        o.name as office_name,
        o.office_id as office_id,
        o.city as office_city,
        o.state as office_state,
        CONCAT(nurse_staff.first_name, ' ', nurse_staff.last_name) as nurse_name,
        n.nurse_id as nurse_id,
        pv.visit_id as visit_id,
        pv.status as status,
        pv.diagnosis as diagnosis,
        pv.present_illnesses as present_illnesses,
        pv.start_at as visit_start,
        pv.end_at as visit_end,
        CASE 
            WHEN pv.start_at IS NOT NULL AND pv.end_at IS NOT NULL 
            THEN TIMESTAMPDIFF(MINUTE, pv.start_at, pv.end_at)
            ELSE NULL 
        END as visit_duration_minutes,
        iplan.plan_name as insurance_plan_name,
        ipayer.name as insurance_company
    FROM appointment a
    LEFT JOIN patient p ON a.Patient_id = p.patient_id
    LEFT JOIN codes_gender cg ON p.gender = cg.gender_code
    LEFT JOIN doctor d ON a.Doctor_id = d.doctor_id
    LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
    LEFT JOIN specialty s ON d.specialty = s.specialty_id
    LEFT JOIN office o ON a.Office_id = o.office_id
    LEFT JOIN (
        SELECT appointment_id, MAX(visit_id) as max_visit_id
        FROM patient_visit
        GROUP BY appointment_id
    ) pvmax ON a.Appointment_id = pvmax.appointment_id
    LEFT JOIN patient_visit pv ON pv.visit_id = pvmax.max_visit_id
    LEFT JOIN nurse n ON pv.nurse_id = n.nurse_id
    LEFT JOIN staff nurse_staff ON n.staff_id = nurse_staff.staff_id
    LEFT JOIN patient_insurance ip ON pv.insurance_policy_id_used = ip.id
    LEFT JOIN insurance_plan iplan ON ip.plan_id = iplan.plan_id
    LEFT JOIN insurance_payer ipayer ON iplan.payer_id = ipayer.payer_id
    $whereClause
    ORDER BY a.Appointment_date DESC";

    error_log("Executing main query");

    $appointments = executeQuery($conn, $sql, $types, $params);

    $statsQuery = "SELECT 
        COUNT(DISTINCT a.Appointment_id) as total_appointments,
        COUNT(DISTINCT a.Patient_id) as unique_patients,
        SUM(CASE WHEN pv.status = 'Completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN pv.status = 'Scheduled' THEN 1 ELSE 0 END) as scheduled_count,
        SUM(CASE WHEN pv.status = 'Canceled' THEN 1 ELSE 0 END) as canceled_count,
        SUM(CASE WHEN pv.status = 'No-Show' THEN 1 ELSE 0 END) as noshow_count,
        COUNT(CASE WHEN a.Appointment_date < NOW() THEN 1 END) as past_appointments,
        COUNT(CASE WHEN a.Appointment_date >= NOW() THEN 1 END) as upcoming_appointments,
        AVG(CASE 
            WHEN pv.start_at IS NOT NULL AND pv.end_at IS NOT NULL 
            THEN TIMESTAMPDIFF(MINUTE, pv.start_at, pv.end_at)
            ELSE NULL 
        END) as avg_visit_duration
    FROM appointment a
    LEFT JOIN (
        SELECT appointment_id, MAX(visit_id) as max_visit_id
        FROM patient_visit
        GROUP BY appointment_id
    ) pvmax_stats ON a.Appointment_id = pvmax_stats.appointment_id
    LEFT JOIN patient_visit pv ON pv.visit_id = pvmax_stats.max_visit_id
    $whereClause";

    $stats = executeQuery($conn, $statsQuery, $types, $params);

    $diagnosisQuery = "SELECT 
        pv.diagnosis,
        COUNT(*) as diagnosis_count
    FROM appointment a
    LEFT JOIN (
        SELECT appointment_id, MAX(visit_id) as max_visit_id
        FROM patient_visit
        GROUP BY appointment_id
    ) pvmax_diag ON a.Appointment_id = pvmax_diag.appointment_id
    LEFT JOIN patient_visit pv ON pv.visit_id = pvmax_diag.max_visit_id
    $whereClause
    AND pv.diagnosis IS NOT NULL 
    AND pv.diagnosis != ''
    GROUP BY pv.diagnosis
    ORDER BY diagnosis_count DESC
    LIMIT 10";

    $topDiagnoses = executeQuery($conn, $diagnosisQuery, $types, $params);

    $reasonQuery = "SELECT 
        a.Reason_for_visit as reason,
        COUNT(*) as reason_count
    FROM appointment a
    LEFT JOIN (
        SELECT appointment_id, MAX(visit_id) as max_visit_id
        FROM patient_visit
        GROUP BY appointment_id
    ) pvmax_reason ON a.Appointment_id = pvmax_reason.appointment_id
    LEFT JOIN patient_visit pv ON pv.visit_id = pvmax_reason.max_visit_id
    $whereClause
    AND a.Reason_for_visit IS NOT NULL 
    AND a.Reason_for_visit != ''
    GROUP BY a.Reason_for_visit
    ORDER BY reason_count DESC
    LIMIT 10";

    $topReasons = executeQuery($conn, $reasonQuery, $types, $params);

    $dayOfWeekQuery = "SELECT 
        DATE_FORMAT(a.Appointment_date, '%W') as day_name,
        COUNT(*) as appointment_count
    FROM appointment a
    LEFT JOIN (
        SELECT appointment_id, MAX(visit_id) as max_visit_id
        FROM patient_visit
        GROUP BY appointment_id
    ) pvmax_day ON a.Appointment_id = pvmax_day.appointment_id
    LEFT JOIN patient_visit pv ON pv.visit_id = pvmax_day.max_visit_id
    $whereClause
    GROUP BY day_name
    ORDER BY FIELD(day_name, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')";

    $appointmentsByDay = executeQuery($conn, $dayOfWeekQuery, $types, $params);

    foreach ($appointments as &$apt) {
        if (isset($apt['appointment_id']))
            $apt['appointment_id'] = (int) $apt['appointment_id'];
        if (isset($apt['patient_id']))
            $apt['patient_id'] = (int) $apt['patient_id'];
        if (isset($apt['doctor_id']))
            $apt['doctor_id'] = (int) $apt['doctor_id'];
        if (isset($apt['nurse_id']))
            $apt['nurse_id'] = (int) $apt['nurse_id'];
        if (isset($apt['visit_id']))
            $apt['visit_id'] = (int) $apt['visit_id'];
        if (isset($apt['patient_age']))
            $apt['patient_age'] = (int) $apt['patient_age'];
        if (isset($apt['visit_duration_minutes']))
            $apt['visit_duration_minutes'] = $apt['visit_duration_minutes'] === null ? null : (int) $apt['visit_duration_minutes'];
    }
    unset($apt);

    $statsRow = (isset($stats[0]) && is_array($stats[0])) ? $stats[0] : [];
    $numericStats = ['total_appointments', 'unique_patients', 'completed_count', 'scheduled_count', 'canceled_count', 'noshow_count', 'past_appointments', 'upcoming_appointments'];
    foreach ($numericStats as $k) {
        if (isset($statsRow[$k])) {
            $statsRow[$k] = (int) $statsRow[$k];
        } else {
            $statsRow[$k] = 0;
        }
    }

    if (isset($statsRow['avg_visit_duration'])) {
        $statsRow['avg_visit_duration'] = round((float) $statsRow['avg_visit_duration'], 1);
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'data' => [
            'appointments' => $appointments,
            'statistics' => $statsRow,
            'top_diagnoses' => $topDiagnoses ?? [],
            'top_reasons' => $topReasons ?? [],
            'appointments_by_day' => $appointmentsByDay ?? [],
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'user_role' => $userRole,
                'doctor_id' => $loggedInDoctorId
            ]
        ]
    ]);
} catch (Exception $e) {
    error_log("Error in get-appointment-report.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
