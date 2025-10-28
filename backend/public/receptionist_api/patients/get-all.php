<?php
// receptionist_api/patients/get-all.php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    $conn = getDBConnection();

    // Optional search query
    $q = isset($_GET['q']) ? trim($_GET['q']) : '';

    if ($q !== '') {
        // Search by name, phone or dob
        $like = '%' . $q . '%';
        $sql = "SELECT p.Patient_ID, p.First_Name, p.Last_Name, p.dob, p.Email, p.EmergencyContact,
                       pi.copay, ip.plan_name, ip.plan_type
                FROM Patient p
                LEFT JOIN patient_insurance pi ON p.InsuranceID = pi.id AND pi.is_primary = 1
                LEFT JOIN insurance_plan ip ON pi.plan_id = ip.plan_id
                WHERE p.First_Name LIKE ? OR p.Last_Name LIKE ? OR p.EmergencyContact LIKE ? OR p.dob = ?
                ORDER BY p.Last_Name, p.First_Name";
        $rows = executeQuery($conn, $sql, 'ssss', [$like, $like, $like, $q]);
    } else {
        // Return a limited list to avoid huge payloads (pagination could be added later)
        $sql = "SELECT p.Patient_ID, p.First_Name, p.Last_Name, p.dob, p.Email, p.EmergencyContact,
                       pi.copay, ip.plan_name, ip.plan_type
                FROM Patient p
                LEFT JOIN patient_insurance pi ON p.InsuranceID = pi.id AND pi.is_primary = 1
                LEFT JOIN insurance_plan ip ON pi.plan_id = ip.plan_id
                ORDER BY p.Last_Name, p.First_Name
                LIMIT 200";
        $rows = executeQuery($conn, $sql);
    }

    // Map to friendly shape used by frontend
    $patients = array_map(function($r) {
        return [
            'Patient_ID' => (int)($r['Patient_ID'] ?? 0),
            'First_Name' => $r['First_Name'] ?? '',
            'Last_Name' => $r['Last_Name'] ?? '',
            'dob' => $r['dob'] ?? '',
            'Email' => $r['Email'] ?? '',
            'EmergencyContact' => $r['EmergencyContact'] ?? '',
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
