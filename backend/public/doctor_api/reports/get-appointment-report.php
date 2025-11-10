<?php
/**
 * Appointment & Visit Summary Report API
 * Location: /doctor_api/reports/get-appointment-report.php
 * 
 * Fetches appointments with comprehensive filtering options
 * Supports both doctor-specific and admin-level reporting
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_log("=== Appointment Report API Called ===");

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    header('Content-Type: application/json; charset=utf-8');

    session_start();
    
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
    
    // Get user role and associated doctor/admin info - FIXED FOR NEW SCHEMA
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
    $loggedInDoctorId = $userInfo[0]['doctor_id'];  // FIXED: Use doctor_id from query
    
    // Verify user has permission to access reports
    if (!in_array($userRole, ['DOCTOR', 'ADMIN'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied. Only doctors and admins can access reports.']);
        closeDBConnection($conn);
        exit;
    }
    
    // Build dynamic WHERE clause based on parameters
    $whereConditions = [];
    $params = [];
    $types = '';
    
    // 1. Date Range (Required - defaults to current month if not provided)
    $startDate = isset($_GET['StartDate']) ? $_GET['StartDate'] : date('Y-m-01');
    $endDate = isset($_GET['EndDate']) ? $_GET['EndDate'] : date('Y-m-t');
    
    // Note: appointment table has mixed case: Appointment_date, Patient_id, Doctor_id, Office_id
    $whereConditions[] = "DATE(a.Appointment_date) BETWEEN ? AND ?";
    $params[] = $startDate;
    $params[] = $endDate;
    $types .= 'ss';
    
    // 2. Doctor Filter
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
    
    // 3. Office Location
    if (isset($_GET['OfficeID']) && $_GET['OfficeID'] !== '' && $_GET['OfficeID'] !== 'all') {
        $whereConditions[] = "a.Office_id = ?";
        $params[] = intval($_GET['OfficeID']);
        $types .= 'i';
    }
    
    // 4. Appointment Status (from patient_visit table)
    if (isset($_GET['Status']) && $_GET['Status'] !== '' && $_GET['Status'] !== 'all') {
        $whereConditions[] = "pv.status = ?";
        $params[] = $_GET['Status'];
        $types .= 's';
    }
    
    // 5. Patient Filter
    if (isset($_GET['PatientID']) && $_GET['PatientID'] !== '' && $_GET['PatientID'] !== 'all') {
        $whereConditions[] = "a.Patient_id = ?";
        $params[] = intval($_GET['PatientID']);
        $types .= 'i';
    }
    
    // 6. Visit Reason
    if (isset($_GET['VisitReason']) && $_GET['VisitReason'] !== '') {
        $whereConditions[] = "a.Reason_for_visit LIKE ?";
        $params[] = '%' . $_GET['VisitReason'] . '%';
        $types .= 's';
    }

    // 7. Nurse Assigned
    if (isset($_GET['NurseID']) && $_GET['NurseID'] !== '' && $_GET['NurseID'] !== 'all') {
        $whereConditions[] = "pv.nurse_id = ?";
        $params[] = intval($_GET['NurseID']);
        $types .= 'i';
    }
    
    // 8. Insurance Policy
    if (isset($_GET['InsurancePolicyID']) && $_GET['InsurancePolicyID'] !== '' && $_GET['InsurancePolicyID'] !== 'all') {
        $whereConditions[] = "pv.insurance_policy_id_used = ?";
        $params[] = intval($_GET['InsurancePolicyID']);
        $types .= 'i';
    }
    
    // Build WHERE clause
    $whereClause = count($whereConditions) > 0 ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    // Main query - FIXED FOR NEW SCHEMA
    $sql = "SELECT 
        a.Appointment_id as appointment_id,
        DATE(a.Appointment_date) as appointment_date,
        DATE_FORMAT(a.Appointment_date, '%H:%i') as appointment_time,
        a.Date_created as date_created,
        a.Reason_for_visit as reason,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.patient_id as patient_id,
        p.dob as patient_dob,
        p.emergency_contact_id as patient_ec_id,
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
        pv.amount_due as total_bill,
        pv.total_due as total_due,
        pv.payment as payment,
        ip.id as insurance_policy_id,
        iplan.plan_name as insurance_plan_name,
        ipayer.name as insurance_company
    FROM appointment a
    LEFT JOIN patient p ON a.Patient_id = p.patient_id
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
    LEFT JOIN nurses n ON pv.nurse_id = n.nurse_id
    LEFT JOIN staff nurse_staff ON n.staff_id = nurse_staff.staff_id
    LEFT JOIN patient_insurance ip ON pv.insurance_policy_id_used = ip.id
    LEFT JOIN insurance_plan iplan ON ip.plan_id = iplan.plan_id
    LEFT JOIN insurance_payer ipayer ON iplan.payer_id = ipayer.payer_id
    $whereClause
    ORDER BY a.Appointment_date DESC";
    
    error_log("Executing main query");
    
    // Execute query
    $appointments = executeQuery($conn, $sql, $types, $params);
    
    // Get summary statistics
    $statsQuery = "SELECT 
        COUNT(DISTINCT a.Appointment_id) as total_appointments,
        SUM(CASE WHEN pv.status = 'Completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN pv.status = 'Scheduled' THEN 1 ELSE 0 END) as scheduled_count,
        SUM(CASE WHEN pv.status = 'Canceled' THEN 1 ELSE 0 END) as canceled_count,
        SUM(CASE WHEN pv.status = 'No-Show' THEN 1 ELSE 0 END) as noshow_count,
        COUNT(CASE WHEN a.Appointment_date < NOW() THEN 1 END) as past_appointments,
        COUNT(CASE WHEN a.Appointment_date >= NOW() THEN 1 END) as upcoming_appointments
    FROM appointment a
    LEFT JOIN (
        SELECT appointment_id, MAX(visit_id) as max_visit_id
        FROM patient_visit
        GROUP BY appointment_id
    ) pvmax_stats ON a.Appointment_id = pvmax_stats.appointment_id
    LEFT JOIN patient_visit pv ON pv.visit_id = pvmax_stats.max_visit_id
    $whereClause";
    
    $stats = executeQuery($conn, $statsQuery, $types, $params);
    
    // Cast numeric types for frontend consistency
    foreach ($appointments as &$apt) {
        if (isset($apt['appointment_id'])) $apt['appointment_id'] = (int)$apt['appointment_id'];
        if (isset($apt['patient_id'])) $apt['patient_id'] = (int)$apt['patient_id'];
        if (isset($apt['doctor_id'])) $apt['doctor_id'] = (int)$apt['doctor_id'];
        if (isset($apt['nurse_id'])) $apt['nurse_id'] = (int)$apt['nurse_id'];
        if (isset($apt['visit_id'])) $apt['visit_id'] = (int)$apt['visit_id'];
        if (isset($apt['total_bill'])) $apt['total_bill'] = $apt['total_bill'] === null ? null : (float)$apt['total_bill'];
    }
    unset($apt);

    $statsRow = (isset($stats[0]) && is_array($stats[0])) ? $stats[0] : [];
    $numericStats = ['total_appointments','completed_count','scheduled_count','canceled_count','noshow_count','past_appointments','upcoming_appointments'];
    foreach ($numericStats as $k) {
        if (isset($statsRow[$k])) {
            $statsRow[$k] = (int)$statsRow[$k];
        } else {
            $statsRow[$k] = 0;
        }
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'data' => [
            'appointments' => $appointments,
            'statistics' => $statsRow,
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
?>