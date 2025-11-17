<?php
/**
 * Get today's appointments for a doctor with REAL-TIME status
 * Returns actual Status from appointment table
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $conn = getDBConnection();

    // Get doctor_id from session
    $doctorSql = "SELECT doctor_id FROM doctor d
                  JOIN user_account ua ON ua.email = d.email
                  WHERE ua.user_id = ?";
    $doctorRows = executeQuery($conn, $doctorSql, 'i', [$_SESSION['uid']]);

    if (empty($doctorRows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Doctor account not found']);
        exit;
    }

    $doctor_id = (int)$doctorRows[0]['doctor_id'];

    // Get today's appointments with REAL STATUS from database
    $sql = "SELECT 
                a.Appointment_id,
                a.Patient_id,
                a.Appointment_date,
                a.Reason_for_visit,
                a.Status,
                a.Office_id,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                p.dob,
                ca.allergies_text as allergies,
                o.name as office_name,
                pv.visit_id,
                pv.blood_pressure,
                pv.temperature,
                pv.created_at as checked_in_at
            FROM appointment a
            LEFT JOIN patient p ON a.Patient_id = p.patient_id
            LEFT JOIN codes_allergies ca ON p.allergies = ca.allergies_code
            LEFT JOIN office o ON a.Office_id = o.office_id
            LEFT JOIN patient_visit pv ON pv.appointment_id = a.Appointment_id
            WHERE a.Doctor_id = ?
            AND DATE(a.Appointment_date) = CURDATE()
            ORDER BY a.Appointment_date ASC";

    $rows = executeQuery($conn, $sql, 'i', [$doctor_id]);

    if (!is_array($rows)) {
        $rows = [];
    }

    $appointments = [];
    $stats = [
        'total' => 0,
        'waiting' => 0,
        'pending' => 0,
        'completed' => 0
    ];

    foreach ($rows as $row) {
        // Calculate age
        $age = null;
        if (!empty($row['dob'])) {
            try {
                $dob = new DateTime($row['dob']);
                $now = new DateTime();
                $age = $now->diff($dob)->y;
            } catch (Exception $e) {
                // Keep age as null
            }
        }

        // Calculate waiting time if checked in
        $waitingMinutes = 0;
        if (!empty($row['checked_in_at'])) {
            try {
                $checkedIn = new DateTime($row['checked_in_at']);
                $now = new DateTime();
                $diff = $now->diff($checkedIn);
                $waitingMinutes = ($diff->h * 60) + $diff->i;
            } catch (Exception $e) {
                // Keep as 0
            }
        }

        // Use ACTUAL status from database - no more auto-calculation
        $status = $row['Status'] ?? 'Scheduled';

        $appointments[] = [
            'id' => $row['Appointment_id'],
            'appointmentId' => 'APT-' . str_pad($row['Appointment_id'], 6, '0', STR_PAD_LEFT),
            'patientId' => $row['Patient_id'],
            'patientName' => $row['patient_name'],
            'time' => date('g:i A', strtotime($row['Appointment_date'])),
            'datetime' => $row['Appointment_date'],
            'reason' => $row['Reason_for_visit'] ?? 'General Consultation',
            'status' => $status, // REAL status from database
            'allergies' => $row['allergies'] ?? 'No Known Allergies',
            'age' => $age,
            'officeId' => $row['Office_id'],
            'officeName' => $row['office_name'],
            'visitId' => $row['visit_id'],
            'hasVitals' => !empty($row['blood_pressure']) || !empty($row['temperature']),
            'waitingMinutes' => $waitingMinutes,
            'checkedInAt' => $row['checked_in_at']
        ];

        // Update stats
        $stats['total']++;
        
        $statusLower = strtolower($status);
        if ($statusLower === 'waiting' || $statusLower === 'ready' || $statusLower === 'checked-in') {
            $stats['waiting']++;
        } elseif ($statusLower === 'scheduled' || $statusLower === 'upcoming') {
            $stats['pending']++;
        } elseif ($statusLower === 'completed') {
            $stats['completed']++;
        }
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'appointments' => $appointments,
        'stats' => $stats
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>