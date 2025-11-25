<?php

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {

    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $user_id = (int)$_SESSION['uid'];
    $conn = getDBConnection();

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

    $q = isset($_GET['q']) ? trim($_GET['q']) : '';

    if ($q !== '') {

    $like = '%' . $q . '%';
    $sql = "SELECT p.patient_id, p.first_name, p.last_name, p.dob, p.email, p.emergency_contact_id,
               ec.ec_phone AS emergency_phone,
               ec.relationship AS emergency_relationship,
               p.primary_doctor,
               pcp_staff.first_name as pcp_first_name, pcp_staff.last_name as pcp_last_name,
               pi.expiration_date,
               ip.copay, ip.plan_name, ip.plan_type
        FROM patient p
        LEFT JOIN emergency_contact ec ON p.emergency_contact_id = ec.emergency_contact_id
        LEFT JOIN doctor pcp ON p.primary_doctor = pcp.doctor_id
        LEFT JOIN staff pcp_staff ON pcp.staff_id = pcp_staff.staff_id
        LEFT JOIN patient_insurance pi ON p.insurance_id = pi.id AND pi.is_primary = 1
        LEFT JOIN insurance_plan ip ON pi.plan_id = ip.plan_id
        WHERE p.first_name LIKE ? OR p.last_name LIKE ? OR ec.ec_phone LIKE ? OR p.dob LIKE ?
        ORDER BY p.last_name, p.first_name";
        $rows = executeQuery($conn, $sql, 'ssss', [$like, $like, $like, $like]);
    } else {

    $sql = "SELECT p.patient_id, p.first_name, p.last_name, p.dob, p.email, p.emergency_contact_id,
               ec.ec_phone AS emergency_phone,
               ec.relationship AS emergency_relationship,
               p.primary_doctor,
               pcp_staff.first_name as pcp_first_name, pcp_staff.last_name as pcp_last_name,
               pi.expiration_date,
               ip.copay, ip.plan_name, ip.plan_type
        FROM patient p
        LEFT JOIN emergency_contact ec ON p.emergency_contact_id = ec.emergency_contact_id
        LEFT JOIN doctor pcp ON p.primary_doctor = pcp.doctor_id
        LEFT JOIN staff pcp_staff ON pcp.staff_id = pcp_staff.staff_id
        LEFT JOIN patient_insurance pi ON p.insurance_id = pi.id AND pi.is_primary = 1
        LEFT JOIN insurance_plan ip ON pi.plan_id = ip.plan_id
        ORDER BY p.last_name, p.first_name
        LIMIT 200";
        $rows = executeQuery($conn, $sql);
    }

    $patients = array_map(function ($r) {
        $pcpName = null;
        if (!empty($r['pcp_first_name']) && !empty($r['pcp_last_name'])) {
            $pcpName = 'Dr. ' . $r['pcp_first_name'] . ' ' . $r['pcp_last_name'];
        }

        return [
            'Patient_ID' => (int)($r['patient_id'] ?? 0),
            'First_Name' => $r['first_name'] ?? '',
            'Last_Name' => $r['last_name'] ?? '',
            'dob' => $r['dob'] ?? '',
            'Email' => $r['email'] ?? '',

            'EmergencyContact' => $r['emergency_phone'] ?? ($r['emergency_contact_id'] ?? ''),
            'EmergencyContactRelationship' => $r['emergency_relationship'] ?? null,
            'primary_doctor' => isset($r['primary_doctor']) ? (int)$r['primary_doctor'] : null,
            'pcp_name' => $pcpName,
            'insurance_expiration' => $r['expiration_date'] ?? null,
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