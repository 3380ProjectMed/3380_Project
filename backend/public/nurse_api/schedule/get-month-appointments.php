<?php
header('Content-Type: application/json');
// /backend/public/nurse_api/schedule/get-month-appointments.php

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

//session_start();
if (empty($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'UNAUTHENTICATED']);
    exit;
}

try {
    $conn = getDBConnection();
    $email = $_SESSION['email'] ?? '';

    // Resolve nurse_id from staff email
    $rows = executeQuery($conn, "SELECT n.nurse_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1", 's', [$email]);
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'NURSE_NOT_FOUND']);
        exit;
    }
    $nurse_id = (int)$rows[0]['nurse_id'];

    // Get year and month from query parameters
    $year = (int)($_GET['year'] ?? date('Y'));
    $month = (int)($_GET['month'] ?? date('n'));

    // Validate year and month
    if ($year < 2000 || $year > 2100 || $month < 1 || $month > 12) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid year or month']);
        closeDBConnection($conn);
        exit;
    }

    // Get appointments for the month
    $sql = "SELECT 
                a.Appointment_id as id,
                a.Appointment_date as appointment_date,
                TIME(a.Appointment_date) as appointment_time,
                a.Status_ as status,
                a.Reason_for_visit as reason,
                p.patient_id,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                o.office_id,
                o.name as office_name,
                o.city
            FROM appointment a
            JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id
            JOIN patient p ON a.Patient_id = p.patient_id
            LEFT JOIN office o ON pv.office_id = o.office_id
            WHERE YEAR(a.Appointment_date) = ? 
            AND MONTH(a.Appointment_date) = ?
            AND pv.nurse_id = ?
            ORDER BY a.Appointment_date";

    $appointments = executeQuery($conn, $sql, 'iii', [$year, $month, $nurse_id]);

    // Group appointments by date
    $grouped = [];
    foreach ($appointments as $apt) {
        $date = date('Y-m-d', strtotime($apt['appointment_date']));
        if (!isset($grouped[$date])) {
            $grouped[$date] = [];
        }

        $grouped[$date][] = [
            'id' => $apt['id'],
            'appointment_date' => $date,
            'appointment_time' => $apt['appointment_time'],
            'patientName' => $apt['patient_name'],
            'patient_name' => $apt['patient_name'], // Support both formats
            'reason' => $apt['reason'],
            'status' => $apt['status'],
            'office_id' => $apt['office_id'],
            'office_name' => $apt['office_name'],
            'location' => $apt['office_name'],
            'location_name' => $apt['office_name']
        ];
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'data' => $grouped,
        'appointments' => $grouped
    ]);
} catch (Exception $e) {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
    http_response_code(500);
    error_log("Error in get-month-appointments.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
