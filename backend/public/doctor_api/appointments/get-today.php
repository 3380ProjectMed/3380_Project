<?php
// Get today's appointments for a doctor 
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {
    $conn = getDBConnection();

    if (isset($_GET['doctor_id'])) {
        $doctor_id = intval($_GET['doctor_id']);
    } else {
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

        $staff_id = (int) $_SESSION['uid'];

        $rows = executeQuery(
            $conn,
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

        $doctor_id = (int) $rows[0]['doctor_id'];
    }

    $tz = new DateTimeZone('America/Chicago');
    $dt = new DateTime('now', $tz);
    $today = $dt->format('Y-m-d');
    $currentDateTime = new DateTime('now', $tz);

    $sql = "SELECT
                a.Appointment_id,
                a.Appointment_date,
                a.Reason_for_visit,
                a.Office_id,
                a.Status,               
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                p.patient_id,
                (
                    SELECT GROUP_CONCAT(ca2.allergies_text SEPARATOR ', ')
                    FROM allergies_per_patient app2
                    JOIN codes_allergies ca2 ON app2.allergy_id = ca2.allergies_code
                    WHERE app2.patient_id = p.patient_id
                ) as allergies,
                o.name as office_name,
                pv.visit_id,            
                pv.blood_pressure,       
                pv.temperature,
                pv.created_at as checked_in_at  
            FROM appointment a
            INNER JOIN patient p ON a.Patient_id = p.patient_id
            LEFT JOIN office o ON a.Office_id = o.office_id
            LEFT JOIN patient_visit pv ON pv.appointment_id = a.Appointment_id  
            WHERE a.Doctor_id = ?
            AND DATE(a.Appointment_date) = ?
            ORDER BY a.Appointment_date";

    $appointments = executeQuery($conn, $sql, 'is', [$doctor_id, $today]);

    $formatted_appointments = [];
    $stats = [
        'total' => 0,
        'upcoming' => 0,
        'waiting' => 0,
        'completed' => 0,
        'pending' => 0
    ];

    foreach ($appointments as $apt) {
        $appointmentDateTime = null;
        try {
            $appointmentDateTime = new DateTime($apt['Appointment_date']);
            $appointmentDateTime->setTimezone($tz);
        } catch (Exception $e) {
            $appointmentDateTime = DateTime::createFromFormat('Y-m-d H:i:s', $apt['Appointment_date'], $tz) ?: new DateTime('now', $tz);
        }

        $status = $apt['Status'] ?? 'Scheduled';

        $minutesUntil = (int) floor(($appointmentDateTime->getTimestamp() - $currentDateTime->getTimestamp()) / 60);

        if ($minutesUntil >= 16) {
            $computedStatus = 'upcoming';
        } elseif ($minutesUntil >= -30 && $minutesUntil <= 15) {
            $computedStatus = 'active';
        } else {
            $computedStatus = 'past';
        }

        // Calculate waiting time if patient has checked in 
        $waitingTime = 0;
        if (!empty($apt['checked_in_at'])) {
            try {
                $checkedIn = new DateTime($apt['checked_in_at']);
                $checkedIn->setTimezone($tz);
                $diff = $currentDateTime->diff($checkedIn);
                $waitingTime = ($diff->h * 60) + $diff->i;
            } catch (Exception $e) {
                // Keep waitingTime as 0
            }
        }

        $formatted_appointments[] = [
            'id' => $apt['Appointment_id'],
            'appointmentId' => 'A' . str_pad($apt['Appointment_id'], 4, '0', STR_PAD_LEFT),
            'patientId' => $apt['patient_id'],
            'patientIdFormatted' => 'P' . str_pad($apt['patient_id'], 3, '0', STR_PAD_LEFT),
            'patientName' => $apt['patient_name'],
            'time' => date('g:i A', strtotime($apt['Appointment_date'] . ' UTC')),
            'appointmentDateTime' => $apt['Appointment_date'],
            'minutesUntil' => $minutesUntil,
            'computedStatus' => $computedStatus,
            'reason' => $apt['Reason_for_visit'] ?: 'General Visit',
            'status' => $status,  
            'dbStatus' => $status,  
            'location' => $apt['office_name'],
            'allergies' => $apt['allergies'] ?: 'No Known Allergies',
            'waitingMinutes' => $waitingTime,
            'visitId' => $apt['visit_id'],
            'hasVitals' => !empty($apt['blood_pressure']) || !empty($apt['temperature']),
            'checkedInAt' => $apt['checked_in_at']
        ];

        // Update stats based on status
        $statusLower = strtolower($status);
        if (in_array($statusLower, ['waiting', 'ready', 'checked-in'])) {
            $stats['waiting']++;
        } elseif (in_array($statusLower, ['scheduled', 'upcoming'])) {
            $stats['upcoming']++;
        } elseif ($statusLower === 'completed') {
            $stats['completed']++;
        }
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