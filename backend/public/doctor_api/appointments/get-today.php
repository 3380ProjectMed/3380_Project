<?php
/**
 * Get today's appointments for a doctor with intelligent status calculation
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    session_start();
    
    $conn = getDBConnection();
    
    // Get doctor_id from query param or derive from session
    if (isset($_GET['doctor_id'])) {
        $doctor_id = intval($_GET['doctor_id']);
    } else {
        // Verify authentication and role
        if (empty($_SESSION['uid']) || empty($_SESSION['role'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Not authenticated']);
            exit;
        }
        
        if ($_SESSION['role'] !== 'DOCTOR') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Doctor access required']);
            exit;
        }
        
        // user_id = staff_id for doctors, get doctor_id
        $staff_id = (int)$_SESSION['uid'];
        
        $rows = executeQuery($conn, 
            'SELECT doctor_id FROM doctor WHERE staff_id = ? LIMIT 1', 
            'i', 
            [$staff_id]
        );
        
        if (empty($rows)) {
            closeDBConnection($conn);
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'No doctor record found']);
            exit;
        }
        
        $doctor_id = (int)$rows[0]['doctor_id'];
    }
    
    // Use America/Chicago timezone
    $tz = new DateTimeZone('America/Chicago');
    $dt = new DateTime('now', $tz);
    $today = $dt->format('Y-m-d');
    $currentDateTime = new DateTime('now', $tz);
    
    // appointment has mixed case, patient/office/codes are lowercase
    $sql = "SELECT
                a.Appointment_id,
                a.Appointment_date,
                a.Reason_for_visit,
                a.Office_id,
                a.Status,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                p.patient_id,
                p.allergies as allergy_code,
                ca.allergies_text as allergies,
                o.name as office_name
            FROM appointment a
            INNER JOIN patient p ON a.Patient_id = p.patient_id
            LEFT JOIN codes_allergies ca ON p.allergies = ca.allergies_code
            LEFT JOIN office o ON a.Office_id = o.office_id
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
        $appointmentDateTime = new DateTime($apt['Appointment_date'], $tz);
        $dbStatus = $apt['Status'] ?? 'Scheduled';
        
        // Determine display status
        $displayStatus = $dbStatus;
        $waitingTime = 0;
        
        if ($dbStatus === 'Completed' || $dbStatus === 'Cancelled' || $dbStatus === 'No-Show') {
            $displayStatus = $dbStatus;
        } else {
            $timeDiff = ($currentDateTime->getTimestamp() - $appointmentDateTime->getTimestamp()) / 60;
            
            if ($timeDiff < -15) {
                $displayStatus = 'Upcoming';
                $stats['upcoming']++;
            } elseif ($timeDiff >= -15 && $timeDiff <= 15) {
                $displayStatus = ($dbStatus === 'In Progress') ? 'In Progress' : 'Ready';
            } elseif ($timeDiff > 15) {
                if ($dbStatus === 'Scheduled') {
                    $displayStatus = 'Waiting';
                    $waitingTime = round($timeDiff);
                    $stats['waiting']++;
                } elseif ($dbStatus === 'In Progress') {
                    $displayStatus = 'In Progress';
                }
            }
        }
        
        if ($displayStatus === 'Completed') {
            $stats['completed']++;
        }
        
        $formatted_appointments[] = [
            'id' => $apt['Appointment_id'],
            'appointmentId' => 'A' . str_pad($apt['Appointment_id'], 4, '0', STR_PAD_LEFT),
            'patientId' => $apt['patient_id'],
            'patientIdFormatted' => 'P' . str_pad($apt['patient_id'], 3, '0', STR_PAD_LEFT),
            'patientName' => $apt['patient_name'],
            'time' => date('g:i A', strtotime($apt['Appointment_date'])),
            'appointmentDateTime' => $apt['Appointment_date'],
            'reason' => $apt['Reason_for_visit'] ?: 'General Visit',
            'status' => $displayStatus,
            'dbStatus' => $dbStatus,
            'location' => $apt['office_name'],
            'allergies' => $apt['allergies'] ?: 'No Known Allergies',
            'waitingMinutes' => $waitingTime
        ];
    }
    
    $stats['total'] = count($formatted_appointments);
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