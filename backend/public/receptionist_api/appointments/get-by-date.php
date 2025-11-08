<?php
/**
 * Get appointments for a specific date at receptionist's office
 * Uses session-based authentication like doctor API
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
    
    if (!isset($_GET['date'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Date parameter is required']);
        exit;
    }
    
    $date = $_GET['date'];
    $user_id = (int)$_SESSION['uid'];
    
    // Resolve the receptionist's office ID
    $conn = getDBConnection();
    
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
        echo json_encode(['success' => false, 'error' => 'No receptionist account associated with the logged-in user']);
        exit;
    }
    
    $office_id = (int)$rows[0]['office_id'];
    
    $sql = "SELECT
                a.Appointment_id,
                a.Appointment_date,
                a.Reason_for_visit,
                a.Status as apt_status,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                p.patient_id as patient_id,
                p.emergency_contact_id,
                CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                d.doctor_id as doctor_id,
                pv.status as visit_status,
                pv.start_at as Check_in_time,
                pi.copay
            FROM appointment a
            INNER JOIN patient p ON a.Patient_id = p.patient_id
            INNER JOIN doctor d ON a.Doctor_id = d.doctor_id
            LEFT JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id
            LEFT JOIN patient_insurance pi ON p.insurance_id = pi.id AND pi.is_primary = 1
            WHERE a.Office_id = ?
            AND DATE(a.Appointment_date) = ?
            ORDER BY a.Appointment_date ASC";
    
    $appointments = executeQuery($conn, $sql, 'is', [$office_id, $date]);
    
    $formatted_appointments = [];
    
    foreach ($appointments as $apt) {
        $dbStatus = $apt['apt_status'] ?? 'Scheduled';
        $visitStatus = $apt['visit_status'] ?? null;
        
        // Determine display status
        $displayStatus = $dbStatus;
        if ($visitStatus === 'Completed') {
            $displayStatus = 'Completed';
        } elseif ($visitStatus === 'Checked In' || $apt['Check_in_time']) {
            $displayStatus = 'Checked In';
        } elseif ($dbStatus === 'Cancelled') {
            $displayStatus = 'Cancelled';
        } else {
            $displayStatus = 'Scheduled';
        }
        
        $formatted_appointments[] = [
            'Appointment_id' => $apt['Appointment_id'],
            'appointmentId' => 'A' . str_pad($apt['Appointment_id'], 4, '0', STR_PAD_LEFT),
            'Patient_id' => $apt['patient_id'],
            'patientIdFormatted' => 'P' . str_pad($apt['patient_id'], 3, '0', STR_PAD_LEFT),
            'patientName' => $apt['patient_name'],
            'Doctor_id' => $apt['doctor_id'],
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
        'office_id' => $office_id
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>