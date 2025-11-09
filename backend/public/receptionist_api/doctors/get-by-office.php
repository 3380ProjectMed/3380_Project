<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/doctors/get-by-office.php
 * ==========================================
 * Get all doctors assigned to an office
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    $officeId = isset($_GET['office_id']) ? (int) $_GET['office_id'] : 0;

    if ($officeId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid office_id required']);
        exit;
    }

    $conn = getDBConnection();

    $sql = "SELECT DISTINCT d.doctor_id, doc_staff.first_name as first_name, doc_staff.last_name as last_name,
             s.specialty_name, s.specialty_id
         FROM doctor d
         LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
         JOIN specialty s ON d.specialty = s.specialty_id
         WHERE d.work_location = ?
         ORDER BY doc_staff.last_name, doc_staff.first_name";

    $rows = executeQuery($conn, $sql, 'i', [$officeId]);
    closeDBConnection($conn);

    $doctors = array_map(function ($r) {
        return [
            'Doctor_id' => (int) $r['doctor_id'],
            'First_Name' => $r['first_name'],
            'Last_Name' => $r['last_name'],
            'specialty_name' => $r['specialty_name'],
            'specialty_id' => (int) $r['specialty_id']
        ];
    }, $rows);

    echo json_encode(['success' => true, 'doctors' => $doctors, 'count' => count($doctors)]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}