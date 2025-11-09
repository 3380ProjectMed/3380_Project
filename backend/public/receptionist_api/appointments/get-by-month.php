<?php
/**
 * Get appointments by month for calendar view
 * Uses session-based authentication
 */
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

    $user_id = (int) $_SESSION['uid'];

    // Validate year and month parameters
    if (!isset($_GET['year']) || !isset($_GET['month'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'year and month parameters are required']);
        exit;
    }

    $year = (int) $_GET['year'];
    $month = (int) $_GET['month'];

    // Validate month range
    if ($month < 1 || $month > 12) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid month. Must be between 1 and 12']);
        exit;
    }

    // Calculate start and end dates for the month
    $start_date = sprintf('%04d-%02d-01', $year, $month);

    // Get last day of month
    $last_day = date('t', strtotime($start_date)); // 't' gives number of days in month
    $end_date = sprintf('%04d-%02d-%02d', $year, $month, $last_day);

    $conn = getDBConnection();

    // Get receptionist's office from their staff record
    try {
        $rows = executeQuery($conn, '
            SELECT s.work_location as office_id
            FROM staff s
            JOIN user_account ua ON ua.email = s.staff_email
            WHERE ua.user_id = ?', 'i', [$user_id]);
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

    // Fetch appointments for the entire month
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

    // Return appointment data
    echo json_encode([
        'success' => true,
        'appointments' => $appointments,
        'count' => count($appointments),
        'office_id' => $office_id,
        'month' => $month,
        'year' => $year,
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
?>