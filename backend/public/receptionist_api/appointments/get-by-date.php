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

    if (!isset($_GET['date'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Date parameter is required']);
        exit;
    }

    $date = $_GET['date'];
    $user_id = (int) $_SESSION['uid'];

    $conn = getDBConnection();

    try {
        $rows = executeQuery($conn, '
            SELECT ws.office_id, o.name as office_name
            FROM staff s
            JOIN user_account ua ON ua.email = s.staff_email
            JOIN work_schedule ws ON ws.staff_id = s.staff_id
            LEFT JOIN office o ON ws.office_id = o.office_id
            WHERE ua.user_id = ?
            LIMIT 1', 'i', [$user_id]);
    } catch (Exception $ex) {
        closeDBConnection($conn);
        throw $ex;
    }

    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No receptionist account associated with the logged-in user']);
        exit;
    }

    $office_id = (int) $rows[0]['office_id'];
    $office_name = $rows[0]['office_name'] ?? 'Unknown Office';

    $sql = "SELECT
                a.Appointment_id,
                a.Appointment_date,
                a.Reason_for_visit,
                a.Status as apt_status,
                a.method,
                a.Patient_id,
                a.Doctor_id,
                a.Office_id,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                p.emergency_contact_id,
                CONCAT(doc_staff.first_name, ' ', doc_staff.last_name) as doctor_name,
                pv.status as visit_status,
                pv.start_at as Check_in_time,
                pv.payment as copay
            FROM appointment a
            INNER JOIN patient p ON a.Patient_id = p.patient_id
            INNER JOIN doctor d ON a.Doctor_id = d.doctor_id
            LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
            LEFT JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id
            WHERE a.Office_id = ?
            AND DATE(a.Appointment_date) = ?
            ORDER BY a.Appointment_date ASC";

    $appointments = executeQuery($conn, $sql, 'is', [$office_id, $date]);

    $formatted_appointments = [];

    foreach ($appointments as $apt) {
        $dbStatus = $apt['apt_status'] ?? 'Scheduled';
        $visitStatus = $apt['visit_status'] ?? null;

        $displayStatus = $dbStatus;

        if ($visitStatus === 'Completed') {
            $displayStatus = 'Completed';
        } elseif ($visitStatus === 'Checked In') {
            $displayStatus = 'Checked-in';
        } elseif ($dbStatus === 'Checked-in') {
            $displayStatus = 'Checked-in';
        } elseif ($dbStatus === 'Cancelled' || $dbStatus === 'Canceled') {
            $displayStatus = 'Cancelled';
        } elseif ($dbStatus === 'No-Show') {
            $displayStatus = 'No-Show';
        } elseif ($dbStatus === 'In Progress') {
            $displayStatus = 'In Progress';
        } elseif ($dbStatus === 'Waiting') {
            $displayStatus = 'Waiting';
        } else {
            $displayStatus = 'Scheduled';
        }

        $formatted_appointments[] = [
            'Appointment_id' => $apt['Appointment_id'],
            'appointmentId' => 'A' . str_pad($apt['Appointment_id'], 4, '0', STR_PAD_LEFT),
            'Patient_id' => $apt['Patient_id'],
            'patientIdFormatted' => 'P' . str_pad($apt['Patient_id'], 3, '0', STR_PAD_LEFT),
            'patientName' => $apt['patient_name'],
            'Doctor_id' => $apt['Doctor_id'],
            'doctorName' => $apt['doctor_name'],
            'time' => date('g:i A', strtotime($apt['Appointment_date'])),
            'Appointment_date' => $apt['Appointment_date'],
            'reason' => $apt['Reason_for_visit'] ?: 'General Visit',
            'status' => $displayStatus,
            'dbStatus' => $dbStatus,
            'emergencyContact' => $apt['emergency_contact_id'],
            'checkInTime' => $apt['Check_in_time'],
            'copay' => $apt['copay'] ? number_format($apt['copay'], 2) : '0.00'
        ];
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'appointments' => $formatted_appointments,
        'count' => count($formatted_appointments),
        'date' => $date,
        'office' => [
            'id' => $office_id,
            'name' => $office_name
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}