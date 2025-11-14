<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/doctors/get-by-office.php
 * ==========================================
 * Get all doctors assigned to an office based on work_schedule
 * FIXED: Now properly queries work_schedule table to show only doctors who work at the office
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

    // Get doctors who are scheduled to work at this office via work_schedule table
    // Join: work_schedule -> staff -> doctor -> specialty
    $sql = "SELECT DISTINCT 
                d.doctor_id, 
                s.first_name, 
                s.last_name,
                sp.specialty_name, 
                sp.specialty_id,
                MIN(ws.start_time) as earliest_start,
                MAX(ws.end_time) as latest_end
            FROM work_schedule ws
            JOIN staff s ON ws.staff_id = s.staff_id
            JOIN doctor d ON s.staff_id = d.staff_id
            JOIN specialty sp ON d.specialty = sp.specialty_id
            WHERE ws.office_id = ?
            GROUP BY d.doctor_id, s.first_name, s.last_name, sp.specialty_name, sp.specialty_id
            ORDER BY s.last_name, s.first_name";

    $rows = executeQuery($conn, $sql, 'i', [$officeId]);
    closeDBConnection($conn);

    $doctors = array_map(function ($r) {
        return [
            'Doctor_id' => (int) $r['doctor_id'],
            'First_Name' => $r['first_name'],
            'Last_Name' => $r['last_name'],
            'specialty_name' => $r['specialty_name'],
            'specialty_id' => (int) $r['specialty_id'],
            'earliest_start' => $r['earliest_start'],
            'latest_end' => $r['latest_end']
        ];
    }, $rows);

    echo json_encode(['success' => true, 'doctors' => $doctors, 'count' => count($doctors)]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}