<?php
/**
 * Get appointments for receptionist's office with intelligent status calculation
 * IMPROVED VERSION: Incorporates best practices from get-today.php and get-by-month.php
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    // Start session and require authentication
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
            SELECT s.work_location as office_id, o.name as office_name
            FROM staff s
            JOIN user_account ua ON ua.email = s.staff_email
            LEFT JOIN office o ON s.work_location = o.office_id
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
    $office_name = $rows[0]['office_name'] ?? 'Unknown Office';
    
    // Use America/Chicago timezone for all date/time operations
    $tz = new DateTimeZone('America/Chicago');
    $currentDateTime = new DateTime('now', $tz);
    
    // Determine date filter
    $dateFilter = '';
    $queryParams = [$office_id];
    $queryTypes = 'i';
    
    if (isset($_GET['date'])) {
        // Filter by specific date
        $targetDate = $_GET['date'];
        $dateFilter = 'AND DATE(a.Appointment_date) = ?';
        $queryParams[] = $targetDate;
        $queryTypes .= 's';
    } elseif (!isset($_GET['show_all']) || $_GET['show_all'] !== 'true') {
        // Default: show today's appointments only
        $today = $currentDateTime->format('Y-m-d');
        $dateFilter = 'AND DATE(a.Appointment_date) = ?';
        $queryParams[] = $today;
        $queryTypes .= 's';
    }
    // else: no date filter - show all appointments for this office
    
    // Query appointments with all necessary joins
    $sql = "SELECT
                a.Appointment_id,
                a.Appointment_date,
                a.Reason_for_visit,
                a.Status,
                a.Patient_id,
                a.Doctor_id,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                p.first_name as patient_first,
                p.last_name as patient_last,
                p.emergency_contact_id,
                p.allergies as allergy_code,
                ca.allergies_text as allergies,
                CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                d.first_name as doctor_first,
                d.last_name as doctor_last,
                pv.visit_id,
                pv.status as visit_status,
                pv.start_at as check_in_time,
                pv.end_at as completion_time,
                pi.copay
            FROM appointment a
            INNER JOIN patient p ON a.Patient_id = p.patient_id
            INNER JOIN doctor d ON a.Doctor_id = d.doctor_id
            LEFT JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id
            LEFT JOIN patient_insurance pi ON p.insuranceid = pi.id AND pi.is_primary = 1
            LEFT JOIN codes_allergies ca ON p.allergies = ca.allergies_code
            WHERE a.Office_id = ? $dateFilter
            ORDER BY a.Appointment_date ASC";
    
    $appointments = executeQuery($conn, $sql, $queryTypes, $queryParams);
    
    // Initialize statistics counters
    $stats = [
        'total' => 0,
        'scheduled' => 0,
        'upcoming' => 0,
        'waiting' => 0,
        'checked_in' => 0,
        'in_progress' => 0,
        'completed' => 0,
        'cancelled' => 0,
        'no_show' => 0
    ];
    
    $formatted_appointments = [];
    
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
        
        // Count cancelled
        if ($displayStatus === 'Cancelled') {
            $stats['cancelled']++;
        }
        
        // Count no-show
        if ($displayStatus === 'No-Show') {
            $stats['no_show']++;
        }
        
        // Count checked in (based on PatientVisit records)
        if ($apt['check_in_time'] && !$apt['completion_time'] && $displayStatus !== 'In Progress') {
            $displayStatus = 'Checked In';
            $stats['checked_in']++;
        }
        
        // Count in progress
        if ($displayStatus === 'In Progress') {
            $stats['in_progress']++;
        }
        
        // Count scheduled (appointments not yet upcoming/waiting/completed/cancelled)
        if ($displayStatus === 'Ready' || $displayStatus === 'Scheduled') {
            $stats['scheduled']++;
        }
        
        // Format appointment data
        $formatted_appointments[] = [
            // ID fields (multiple formats for compatibility)
            'id' => $apt['Appointment_id'],
            'Appointment_id' => $apt['Appointment_id'],
            'appointmentId' => 'A' . str_pad($apt['Appointment_id'], 4, '0', STR_PAD_LEFT),
            
            // Patient fields
            'patientId' => $apt['Patient_id'],
            'Patient_id' => $apt['Patient_id'],
            'patientIdFormatted' => 'P' . str_pad($apt['Patient_id'], 3, '0', STR_PAD_LEFT),
            'patientName' => $apt['patient_name'],
            'Patient_First' => $apt['patient_first'],
            'Patient_Last' => $apt['patient_last'],
            
            // Doctor fields
            'doctorId' => $apt['Doctor_id'],
            'Doctor_id' => $apt['Doctor_id'],
            'doctorName' => $apt['doctor_name'],
            'Doctor_First' => $apt['doctor_first'],
            'Doctor_Last' => $apt['doctor_last'],
            
            // Time fields
            'time' => date('g:i A', strtotime($apt['Appointment_date'])),
            'appointmentDateTime' => $apt['Appointment_date'],
            'Appointment_date' => $apt['Appointment_date'],
            
            // Status fields
            'status' => $displayStatus,
            'Status' => $displayStatus,
            'dbStatus' => $dbStatus,
            'waitingMinutes' => $waitingTime,
            
            // Other fields
            'reason' => $apt['Reason_for_visit'] ?: 'General Visit',
            'Reason_for_visit' => $apt['Reason_for_visit'] ?: 'General Visit',
            'emergencyContact' => $apt['emergency_contact_id'],
            'allergies' => $apt['allergies'] ?: 'No Known Allergies',
            'checkInTime' => $apt['check_in_time'],
            'completionTime' => $apt['completion_time'],
            'copay' => $apt['copay'] ? floatval($apt['copay']) : 0.00,
            'visitId' => $apt['visit_id']
        ];
    }
    
    $stats['total'] = count($formatted_appointments);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'appointments' => $formatted_appointments,
        'stats' => $stats,
        'count' => count($formatted_appointments),
        'office' => [
            'id' => $office_id,
            'name' => $office_name
        ],
        'currentTime' => $currentDateTime->format('Y-m-d H:i:s'),
        'timezone' => 'America/Chicago',
        'filters' => [
            'date' => isset($_GET['date']) ? $_GET['date'] : (isset($_GET['show_all']) && $_GET['show_all'] === 'true' ? 'all' : $currentDateTime->format('Y-m-d'))
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