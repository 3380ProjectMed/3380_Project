<?php
/**
 * Get today's appointments for a doctor with intelligent status calculation
 */
require_once '/home/site/wwwroot/cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    // Start session and require that the user is logged in
    session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    if ($_SESSION['role'] === 'ADMIN' || isset($_GET['doctor_id'])) {
  $doctor_id = intval($_GET['doctor_id']);
} else {
  // Resolve from logged-in user
  $doctor_id = get_doctor_id_from_session();
}
    $user_id = (int)$_SESSION['uid'];
    
    // Resolve the doctor's id for this logged-in user
    $conn = getDBConnection();
    
    try {
        $rows = executeQuery($conn, '
            SELECT d.Doctor_id
            FROM Doctor d
            JOIN user_account ua ON ua.email = d.Email
            WHERE ua.user_id = ?', 'i', [$user_id]);
    } catch (Exception $ex) {
        closeDBConnection($conn);
        throw $ex;
    }
    
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No doctor account associated with the logged-in user']);
        exit;
    }
    
    $doctor_id = (int)$rows[0]['Doctor_id'];
    
    // Use America/Chicago timezone for all comparisons so UI shows local Chicago times
    $tz = new DateTimeZone('America/Chicago');
    $dt = new DateTime('now', $tz);
    $today = $dt->format('Y-m-d');

    // Current time in Chicago for status calculation
    $currentDateTime = new DateTime('now', $tz);
    
    $sql = "SELECT
                a.Appointment_id,
                a.Appointment_date,
                a.Reason_for_visit,
                a.Office_id,
                a.Status,
                CONCAT(p.First_Name, ' ', p.Last_Name) as patient_name,
                p.Patient_ID as patient_id,
                p.Allergies as allergy_code,
                ca.Allergies_Text as allergies,
                o.Name as office_name
            FROM Appointment a
            INNER JOIN Patient p ON a.Patient_id = p.Patient_ID
            LEFT JOIN CodesAllergies ca ON p.Allergies = ca.AllergiesCode
            LEFT JOIN Office o ON a.Office_id = o.Office_ID
            WHERE a.Doctor_id = ?
            AND DATE(a.Appointment_date) = ?
            ORDER BY a.Appointment_date";
    
    $appointments = executeQuery($conn, $sql, 'is', [$doctor_id, $today]);
    
    $formatted_appointments = [];
    $stats = [
        'total' => 0,
        'upcoming' => 0,
        'waiting' => 0,
        'completed' => 0
    ];
    
    foreach ($appointments as $apt) {
    // Parse appointment datetime and normalize to Chicago timezone
    $appointmentDateTime = new DateTime($apt['Appointment_date'], $tz);
        $dbStatus = $apt['Status'] ?? 'Scheduled';
        
        // Determine display status based on time and database status
        $displayStatus = $dbStatus;
        $waitingTime = 0;
        
        if ($dbStatus === 'Completed' || $dbStatus === 'Cancelled' || $dbStatus === 'No-Show') {
            // Keep the database status
            $displayStatus = $dbStatus;
        } else {
            // Calculate time difference in minutes
            $timeDiff = ($currentDateTime->getTimestamp() - $appointmentDateTime->getTimestamp()) / 60;
            
            if ($timeDiff < -15) {
                // Appointment is more than 15 minutes in the future
                $displayStatus = 'Upcoming';
                $stats['upcoming']++;
            } elseif ($timeDiff >= -15 && $timeDiff <= 15) {
                // Appointment time is now (within 15 min window)
                $displayStatus = ($dbStatus === 'In Progress') ? 'In Progress' : 'Ready';
            } elseif ($timeDiff > 15) {
                // Appointment time has passed by more than 15 minutes
                if ($dbStatus === 'Scheduled') {
                    $displayStatus = 'Waiting';
                    $waitingTime = round($timeDiff);
                    $stats['waiting']++;
                } elseif ($dbStatus === 'In Progress') {
                    $displayStatus = 'In Progress';
                }
            }
        }
        
        // Count completed
        if ($displayStatus === 'Completed') {
            $stats['completed']++;
        }
        
        $formatted_appointments[] = [
            'id' => $apt['Appointment_id'], // Keep as integer for backend operations
            'appointmentId' => 'A' . str_pad($apt['Appointment_id'], 4, '0', STR_PAD_LEFT),
            'patientId' => $apt['patient_id'], // Keep as integer
            'patientIdFormatted' => 'P' . str_pad($apt['patient_id'], 3, '0', STR_PAD_LEFT),
            'patientName' => $apt['patient_name'],
            'time' => date('g:i A', strtotime($apt['Appointment_date'])),
            'appointmentDateTime' => $apt['Appointment_date'],
            'reason' => $apt['Reason_for_visit'] ?: 'General Visit',
            'status' => $displayStatus,
            'dbStatus' => $dbStatus, // Original database status
            'location' => $apt['office_name'],
            'allergies' => $apt['allergies'] ?: 'No Known Allergies',
            'waitingMinutes' => $waitingTime
        ];
    }
    
    $stats['total'] = count($formatted_appointments);
    
    // Update the "pending" stat to match "upcoming"
    $stats['pending'] = $stats['upcoming'];
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'appointments' => $formatted_appointments,
        'stats' => $stats,
        'count' => count($formatted_appointments),
        'currentTime' => $currentDateTime->format('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
