<?php
/**
 * Get today's appointments for receptionist's office with intelligent status calculation
 * Uses session-based authentication like doctor API
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
    
    // Resolve the receptionist's office ID from their staff record
    $conn = getDBConnection();
    
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
        echo json_encode(['success' => false, 'error' => 'No receptionist account associated with the logged-in user']);
        exit;
    }
    
    $office_id = (int)$rows[0]['office_id'];
    
    // Use America/Chicago timezone for all comparisons
    $tz = new DateTimeZone('America/Chicago');
    $dt = new DateTime('now', $tz);
    $today = $dt->format('Y-m-d');
    
    // Current time in Chicago for status calculation
    $currentDateTime = new DateTime('now', $tz);
    
    $sql = "SELECT
                a.Appointment_id,
                a.Appointment_date,
                a.Reason_for_visit,
                a.Status,
                CONCAT(p.First_Name, ' ', p.Last_Name) as patient_name,
                p.Patient_ID as patient_id,
                p.EmergencyContact,
                CONCAT(d.First_Name, ' ', d.Last_Name) as doctor_name,
                d.Doctor_id as doctor_id,
                pv.Visit_id,
                pv.Status as visit_status,
                pv.Start_at as check_in_time,
                pv.End_at as completion_time,
                pi.copay
            FROM Appointment a
            INNER JOIN Patient p ON a.Patient_id = p.Patient_ID
            INNER JOIN Doctor d ON a.Doctor_id = d.Doctor_id
            LEFT JOIN PatientVisit pv ON a.Appointment_id = pv.Appointment_id
            LEFT JOIN patient_insurance pi ON p.InsuranceID = pi.id AND pi.is_primary = 1
            WHERE a.Office_id = ?
            AND DATE(a.Appointment_date) = ?
            ORDER BY a.Appointment_date ASC";
    
    $appointments = executeQuery($conn, $sql, 'is', [$office_id, $today]);
    
    $formatted_appointments = [];
    $stats = [
        'total' => 0,
        'scheduled' => 0,
        'checked_in' => 0,
        'completed' => 0,
        'cancelled' => 0
    ];
    
    foreach ($appointments as $apt) {
        // Parse appointment datetime
        $appointmentDateTime = new DateTime($apt['Appointment_date'], $tz);
        $dbStatus = $apt['Status'] ?? 'Scheduled';
        $visitStatus = $apt['visit_status'] ?? null;
        
        // Determine display status
        $displayStatus = $dbStatus;
        if ($apt['completion_time']) {
            $displayStatus = 'Completed';
            $stats['completed']++;
        } elseif ($apt['check_in_time']) {
            $displayStatus = 'Checked In';
            $stats['checked_in']++;
        } elseif ($dbStatus === 'Cancelled') {
            $displayStatus = 'Cancelled';
            $stats['cancelled']++;
        } else {
            $displayStatus = 'Scheduled';
            $stats['scheduled']++;
        }
        
        $formatted_appointments[] = [
            'id' => $apt['Appointment_id'],
            'appointmentId' => 'A' . str_pad($apt['Appointment_id'], 4, '0', STR_PAD_LEFT),
            'patientId' => $apt['patient_id'],
            'patientIdFormatted' => 'P' . str_pad($apt['patient_id'], 3, '0', STR_PAD_LEFT),
            'patientName' => $apt['patient_name'],
            'doctorId' => $apt['doctor_id'],
            'doctorName' => $apt['doctor_name'],
            'time' => date('g:i A', strtotime($apt['Appointment_date'])),
            'appointmentDateTime' => $apt['Appointment_date'],
            'reason' => $apt['Reason_for_visit'] ?: 'General Visit',
            'status' => $displayStatus,
            'dbStatus' => $dbStatus,
            'emergencyContact' => $apt['EmergencyContact'],
            'checkInTime' => $apt['check_in_time'],
            'copay' => $apt['copay'] ? number_format($apt['copay'], 2) : '0.00'
        ];
    }
    
    $stats['total'] = count($formatted_appointments);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'appointments' => $formatted_appointments,
        'stats' => $stats,
        'count' => count($formatted_appointments),
        'currentTime' => $currentDateTime->format('Y-m-d H:i:s'),
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