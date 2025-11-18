<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {
    // same admin check as other reports
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    $conn = getDBConnection();

    $office_id   = isset($_GET['office_id']) ? (int)$_GET['office_id'] : null;
    $start_date  = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
    $end_date    = $_GET['end_date']   ?? date('Y-m-d');
    $status      = $_GET['status']     ?? 'all';

    if (!$office_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'office_id is required']);
        exit;
    }

    if (
        !preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date) ||
        !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)
    ) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid date format']);
        exit;
    }

    $where = [
        'a.Office_id = ?',
        'DATE(a.Appointment_date) BETWEEN ? AND ?'
    ];
    $params = [$office_id, $start_date, $end_date];
    $types  = 'iss';

    if ($status !== 'all') {
        $where[] = 'a.Status = ?';
        $params[] = $status;
        $types   .= 's';
    }

    $sql = "SELECT
                a.Appointment_id,
                a.Appointment_date,
                a.Status,
                o.name AS office_name,
                CONCAT(s.first_name, ' ', s.last_name)   AS doctor_name,
                CONCAT(p.first_name, ' ', p.last_name)   AS patient_name
            FROM Appointment a
            JOIN office  o ON a.Office_id  = o.office_id
            JOIN doctor  d ON a.Doctor_id  = d.doctor_id
            JOIN staff s ON s.staff_id = d.staff_id
            JOIN patient p ON a.Patient_id = p.patient_id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY a.Appointment_date DESC, a.Appointment_id DESC";

    $rows = executeQuery($conn, $sql, $types, $params);

    closeDBConnection($conn);

    echo json_encode([
        'success'   => true,
        'office_id' => $office_id,
        'start_date'=> $start_date,
        'end_date'  => $end_date,
        'appointments' => $rows
    ], JSON_NUMERIC_CHECK);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
