<?php
/**
 * Get appointments by office and date range for calendar view
 * NEW FILE: This is a GET endpoint for fetching appointments
 * (The old get-by-office.php was actually an UPDATE endpoint - rename it to update.php)
 */
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    // Start session and require that the user is logged in
    session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    $user_id = (int)$_SESSION['uid'];
    
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
    
    // Get receptionist's office from their staff record
    try {
        $rows = executeQuery($conn, '
            SELECT s.Work_Location as office_id
            FROM Staff s
            JOIN user_account ua ON ua.email = s.Staff_Email
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
    
    $office_id = (int)$rows[0]['office_id'];
    
    // Fetch appointments with all necessary fields for calendar display
    // ✅ Returns separate name fields that the frontend expects
    $sql = "SELECT
                a.Appointment_id,
                a.Appointment_date,
                a.Reason_for_visit,
                a.Status,
                a.Doctor_id,
                p.Patient_ID,
                p.First_Name as Patient_First,
                p.Last_Name as Patient_Last,
                d.First_Name as Doctor_First,
                d.Last_Name as Doctor_Last,
                pv.Status as visit_status,
                pv.Start_at as check_in_time,
                pv.End_at as completion_time
            FROM Appointment a
            INNER JOIN Patient p ON a.Patient_id = p.Patient_ID
            INNER JOIN Doctor d ON a.Doctor_id = d.Doctor_id
            LEFT JOIN PatientVisit pv ON a.Appointment_id = pv.Appointment_id
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
?>