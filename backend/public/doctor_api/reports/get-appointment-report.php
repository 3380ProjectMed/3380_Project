<?php
/**
 * Appointment & Visit Summary Report API
 * Location: /doctor_api/reports/get-appointment-report.php
 * 
 * Fetches appointments with comprehensive filtering options
 * Supports both doctor-specific and admin-level reporting
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', '/home/site/wwwroot/logs/php_errors.log');


require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    // Ensure JSON response header for frontend
    header('Content-Type: application/json; charset=utf-8');

    session_start();
    if (!function_exists('getDBConnection')) {
        throw new Exception('Database helper functions not loaded');
    }
    
    // Authentication check
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
    
    // Get user role and associated doctor/admin info
    $userQuery = "SELECT ua.role, d.Doctor_id 
                  FROM user_account ua 
                  LEFT JOIN Doctor d ON ua.email = d.Email 
                  WHERE ua.user_id = ? LIMIT 1";
    $userInfo = executeQuery($conn, $userQuery, 'i', [$user_id]);
    
    if (!is_array($userInfo) || count($userInfo) === 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        closeDBConnection($conn);
        exit;
    }
    
    $userRole = $userInfo[0]['role'];
    $loggedInDoctorId = $userInfo[0]['Doctor_id'];
    
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
    
    $whereConditions[] = "DATE(a.Appointment_date) BETWEEN ? AND ?";
    $params[] = $startDate;
    $params[] = $endDate;
    $types .= 'ss';
    
    // 2. Doctor Filter
        if ($userRole === 'DOCTOR') {
        // Doctors can only see their own appointments
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
        // Admins can filter by specific doctor or see all
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
    
    // 4. Appointment Status (from PatientVisit table)
    if (isset($_GET['Status']) && $_GET['Status'] !== '' && $_GET['Status'] !== 'all') {
        $whereConditions[] = "pv.Status = ?";
        $params[] = $_GET['Status'];
        $types .= 's';
    }
    
    // 5. Patient Filter
    if (isset($_GET['PatientID']) && $_GET['PatientID'] !== '' && $_GET['PatientID'] !== 'all') {
        $whereConditions[] = "a.Patient_id = ?";
        $params[] = intval($_GET['PatientID']);
        $types .= 'i';
    }
    
    // 6. Visit Reason (Reason_for_visit from Appointment table)
    if (isset($_GET['VisitReason']) && $_GET['VisitReason'] !== '') {
        $whereConditions[] = "a.Reason_for_visit LIKE ?";
        $params[] = '%' . $_GET['VisitReason'] . '%';
        $types .= 's';
    }

    // BookingChannel is not a column in this schema (medapp.sql), so ignore this filter if supplied.

    // 8. Insurance Policy
    if (isset($_GET['InsurancePolicyID']) && $_GET['InsurancePolicyID'] !== '' && $_GET['InsurancePolicyID'] !== 'all') {
        // pv.Insurance_policy_id_used links to patient_insurance.id
        $whereConditions[] = "pv.Insurance_policy_id_used = ?";
        $params[] = intval($_GET['InsurancePolicyID']);
        $types .= 'i';
    }
    
    // 7. Nurse Assigned (from PatientVisit table)
    if (isset($_GET['NurseID']) && $_GET['NurseID'] !== '' && $_GET['NurseID'] !== 'all') {
        $whereConditions[] = "pv.Nurse_id = ?";
        $params[] = intval($_GET['NurseID']);
        $types .= 'i';
    }
    
    // Build WHERE clause
    $whereClause = count($whereConditions) > 0 ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    // Main query - matching your actual schema
    $sql = "SELECT 
    a.Appointment_id,
    DATE(a.Appointment_date) as Appointment_date,
    DATE_FORMAT(a.Appointment_date, '%H:%i') as Appointment_time,
    a.Date_created,
    a.Reason_for_visit as Reason,
    CONCAT(p.First_Name, ' ', p.Last_Name) as patient_name,
    p.Patient_ID as patient_id,
    p.dob as patient_dob,
    p.EmergencyContact as patient_phone,
    CONCAT(d.First_Name, ' ', d.Last_Name) as doctor_name,
    d.Doctor_id,
    s.specialty_name as doctor_specialty,
    o.Name as office_name,
    o.Office_ID,
    o.City as office_city,
    o.State as office_state,
    CONCAT(staff.First_Name, ' ', staff.Last_Name) as nurse_name,
    n.Nurse_id,
    pv.Visit_id,
    pv.Status,
    pv.Diagnosis,
    pv.Treatment,
    pv.AmountDue as Total_bill,
    pv.TotalDue,
    pv.Payment,
    ip.id as insurance_policy_id,
    iplan.plan_name as insurance_plan_name,
    ipayer.NAME as insurance_company
FROM Appointment a
LEFT JOIN Patient p ON a.Patient_id = p.Patient_ID
LEFT JOIN Doctor d ON a.Doctor_id = d.Doctor_id
LEFT JOIN Specialty s ON d.Specialty = s.specialty_id
LEFT JOIN Office o ON a.Office_id = o.Office_ID
-- Join only the most recent PatientVisit per appointment
LEFT JOIN (
    SELECT Appointment_id, MAX(Visit_id) as max_visit_id
    FROM PatientVisit
    GROUP BY Appointment_id
) pvmax ON a.Appointment_id = pvmax.Appointment_id
LEFT JOIN PatientVisit pv ON pv.Visit_id = pvmax.max_visit_id
LEFT JOIN Nurse n ON pv.Nurse_id = n.Nurse_id
LEFT JOIN Staff staff ON n.Staff_id = staff.Staff_id
LEFT JOIN patient_insurance ip ON pv.insurance_policy_id_used = ip.id  -- ✅ FIXED: lowercase 'insurance_policy_id_used'
LEFT JOIN insurance_plan iplan ON ip.plan_id = iplan.plan_id
LEFT JOIN insurance_payer ipayer ON iplan.payer_id = ipayer.payer_id
$whereClause
ORDER BY a.Appointment_date DESC";
    
    // Execute query
    $appointments = executeQuery($conn, $sql, $types, $params);
    
    // Get summary statistics
    $statsQuery = "SELECT 
        COUNT(DISTINCT a.Appointment_id) as total_appointments,
        SUM(CASE WHEN pv.Status = 'Completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN pv.Status = 'Scheduled' THEN 1 ELSE 0 END) as scheduled_count,
        SUM(CASE WHEN pv.Status = 'Canceled' THEN 1 ELSE 0 END) as canceled_count,
        SUM(CASE WHEN pv.Status = 'No-Show' THEN 1 ELSE 0 END) as noshow_count,
        COUNT(CASE WHEN a.Appointment_date < NOW() THEN 1 END) as past_appointments,
        COUNT(CASE WHEN a.Appointment_date >= NOW() THEN 1 END) as upcoming_appointments
    FROM Appointment a
    LEFT JOIN (
        SELECT Appointment_id, MAX(Visit_id) as max_visit_id
        FROM PatientVisit
        GROUP BY Appointment_id
    ) pvmax_stats ON a.Appointment_id = pvmax_stats.Appointment_id
    LEFT JOIN PatientVisit pv ON pv.Visit_id = pvmax_stats.max_visit_id
    $whereClause";
    
    $stats = executeQuery($conn, $statsQuery, $types, $params);
    
    // Cast numeric types for frontend consistency
    foreach ($appointments as &$apt) {
        if (isset($apt['Appointment_id'])) $apt['Appointment_id'] = (int)$apt['Appointment_id'];
        if (isset($apt['patient_id'])) $apt['patient_id'] = (int)$apt['patient_id'];
        if (isset($apt['Doctor_id'])) $apt['Doctor_id'] = (int)$apt['Doctor_id'];
        if (isset($apt['Nurse_id'])) $apt['Nurse_id'] = (int)$apt['Nurse_id'];
        if (isset($apt['Visit_id'])) $apt['Visit_id'] = (int)$apt['Visit_id'];
        if (isset($apt['Total_bill'])) $apt['Total_bill'] = $apt['Total_bill'] === null ? null : (float)$apt['Total_bill'];
    }
    unset($apt);

    $statsRow = (isset($stats[0]) && is_array($stats[0])) ? $stats[0] : [];
    // Ensure numeric typing for stats
    $numericStats = ['total_appointments','completed_count','scheduled_count','canceled_count','noshow_count','past_appointments','upcoming_appointments'];
    foreach ($numericStats as $k) {
        if (isset($statsRow[$k])) {
            // Use float for revenue-like fields, int for counts
            if (in_array($k, ['total_revenue','total_payments','total_outstanding'])) {
                $statsRow[$k] = (float)$statsRow[$k];
            } else {
                $statsRow[$k] = (int)$statsRow[$k];
            }
        } else {
            $statsRow[$k] = in_array($k, ['total_revenue','total_payments','total_outstanding']) ? 0.0 : 0;
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
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage()
    ]);
}
?>