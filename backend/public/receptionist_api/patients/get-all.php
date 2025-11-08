<?php
// receptionist_api/patients/get-all.php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    // Start session and require that the user is logged in
    session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    $user_id = (int)$_SESSION['uid'];
    $conn = getDBConnection();
    
    // Verify receptionist
    $verifyStaffSql = "SELECT s.staff_id 
                       FROM staff s 
                       JOIN user_account ua ON ua.email = s.staff_email 
                       WHERE ua.user_id = ? AND s.staff_role = 'Receptionist'";
    $staffResult = executeQuery($conn, $verifyStaffSql, 'i', [$user_id]);
    
    if (empty($staffResult)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied - receptionist only']);
        exit;
    }

    // Optional search query
    $q = isset($_GET['q']) ? trim($_GET['q']) : '';

    if ($q !== '') {
        // Search by name, phone or dob
        $like = '%' . $q . '%';
        $sql = "SELECT p.patient_id, p.first_name, p.last_name, p.dob, p.email, p.emergency_contact_id,
                       ip.copay, ip.plan_name, ip.plan_type
                FROM patient p
                LEFT JOIN patient_insurance pi ON p.insurance_id = pi.id AND pi.is_primary = 1
                LEFT JOIN insurance_plan ip ON pi.plan_id = ip.plan_id
                WHERE p.first_name LIKE ? OR p.last_name LIKE ? OR p.emergency_contact_id LIKE ? OR p.dob = ?
                ORDER BY p.last_name, p.first_name";
        $rows = executeQuery($conn, $sql, 'ssss', [$like, $like, $like, $q]);
    } else {
        // Return a limited list to avoid huge payloads (pagination could be added later)
        $sql = "SELECT p.patient_id, p.first_name, p.last_name, p.dob, p.email, p.emergency_contact_id,
                       ip.copay, ip.plan_name, ip.plan_type
                FROM patient p
                LEFT JOIN patient_insurance pi ON p.insurance_id = pi.id AND pi.is_primary = 1
                LEFT JOIN insurance_plan ip ON pi.plan_id = ip.plan_id
                ORDER BY p.last_name, p.first_name
                LIMIT 200";
        $rows = executeQuery($conn, $sql);
    }

    // Map to friendly shape used by frontend
    $patients = array_map(function($r) {
        return [
            'Patient_ID' => (int)($r['patient_id'] ?? 0),
            'First_Name' => $r['first_name'] ?? '',
            'Last_Name' => $r['last_name'] ?? '',
            'dob' => $r['dob'] ?? '',
            'Email' => $r['email'] ?? '',
            'EmergencyContact' => $r['emergency_contact_id'] ?? '',
            'copay' => isset($r['copay']) ? (float)$r['copay'] : null,
            'plan_name' => $r['plan_name'] ?? null,
            'plan_type' => $r['plan_type'] ?? null,
        ];
    }, $rows);

    closeDBConnection($conn);

    echo json_encode(['success' => true, 'patients' => $patients, 'count' => count($patients)]);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}