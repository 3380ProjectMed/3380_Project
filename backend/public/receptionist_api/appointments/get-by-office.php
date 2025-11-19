<?php

/**
 * Get appointments by office and date range for calendar view
 * NEW FILE: This is a GET endpoint for fetching appointments
 * (The old get-by-office.php was actually an UPDATE endpoint - rename it to update.php)
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    // Start session and require that the user is logged in
    //session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $user_id = (int) $_SESSION['uid'];

    // Validate date parameters
    if (!isset($_GET['start_date']) || !isset($_GET['end_date'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'start_date and end_date parameters are required']);
        exit;
    }

    $start_date = $_GET['start_date'];
    $end_date = $_GET['end_date'];

    // Validate date format (YYYY-MM-DD)
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid date format. Use YYYY-MM-DD']);
        exit;
    }

    $conn = getDBConnection();

    // Get receptionist's office from work_schedule
    try {
        $rows = executeQuery($conn, '
            SELECT ws.office_id
            FROM staff s
            JOIN user_account ua ON ua.email = s.staff_email
            JOIN work_schedule ws ON ws.staff_id = s.staff_id
            WHERE ua.user_id = ?
            LIMIT 1', 'i', [$user_id]);
    } catch (Exception $ex) {
        closeDBConnection($conn);
        throw $ex;
    }

    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No receptionist account found for this user']);
        exit;
    }

    $office_id = (int) $rows[0]['office_id'];

    // Fetch appointments with all necessary fields for calendar display
    // ✅ Returns separate name fields that the frontend expects
    $sql = "SELECT
                a.Appointment_id,
                a.Appointment_date,
                a.Reason_for_visit,
                a.Status,
                a.Doctor_id,
                p.patient_id,
                p.first_name as Patient_First,
                p.last_name as Patient_Last,
                doc_staff.first_name as Doctor_First,
                doc_staff.last_name as Doctor_Last,
                pv.status as visit_status,
                pv.start_at as check_in_time,
                pv.end_at as completion_time
            FROM appointment a
            INNER JOIN patient p ON a.Patient_id = p.patient_id
            INNER JOIN doctor d ON a.Doctor_id = d.doctor_id
            LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
            LEFT JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id
            WHERE a.Office_id = ?
            AND DATE(a.Appointment_date) BETWEEN ? AND ?
            ORDER BY a.Appointment_date ASC";

    $appointments = executeQuery($conn, $sql, 'iss', [$office_id, $start_date, $end_date]);

    closeDBConnection($conn);

    // Return raw appointment data with field names matching frontend expectations
    echo json_encode([
        'success' => true,
        'appointments' => $appointments,
        'count' => count($appointments),
        'office_id' => $office_id,
        'date_range' => [
            'start' => $start_date,
            'end' => $end_date
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
