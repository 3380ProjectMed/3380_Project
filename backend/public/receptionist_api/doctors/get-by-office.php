<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/doctors/get-by-office.php
 * ==========================================
 * Get all doctors assigned to an office
 */
require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../database.php';

try {
    $officeId = isset($_GET['office_id']) ? (int)$_GET['office_id'] : 0;
    
    if ($officeId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid office_id required']);
        exit;
    }

    $conn = getDBConnection();
    
    $sql = "SELECT DISTINCT d.Doctor_id, d.First_Name, d.Last_Name,
                   s.specialty_name, s.Specialty_id
            FROM Doctor d
            JOIN Specialty s ON d.Specialty_id = s.Specialty_id
            JOIN Works_At wa ON d.Doctor_id = wa.Doctor_id
            WHERE wa.Office_id = ?
            ORDER BY d.Last_Name, d.First_Name";
    
    $rows = executeQuery($conn, $sql, 'i', [$officeId]);
    closeDBConnection($conn);

    $doctors = array_map(function($r) {
        return [
            'Doctor_id' => (int)$r['Doctor_id'],
            'First_Name' => $r['First_Name'],
            'Last_Name' => $r['Last_Name'],
            'specialty_name' => $r['specialty_name'],
            'Specialty_id' => (int)$r['Specialty_id']
        ];
    }, $rows);

    echo json_encode(['success' => true, 'doctors' => $doctors, 'count' => count($doctors)]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
