<?php
/**
 * Get today's appointments for a doctor with REAL-TIME status from database
 * Updated to work with your authentication system (staff_id based)
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {
    $conn = getDBConnection();

    // Get doctor_id from query param or derive from session
    if (isset($_GET['doctor_id'])) {
        $doctor_id = intval($_GET['doctor_id']);
    } else {
        // Verify authentication and role (YOUR AUTH SYSTEM)
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

        // user_id = staff_id for doctors, get doctor_id (YOUR AUTH SYSTEM)
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

    // Use America/Chicago timezone
    $tz = new DateTimeZone('America/Chicago');
    $dt = new DateTime('now', $tz);
    $today = $dt->format('Y-m-d');
    $currentDateTime = new DateTime('now', $tz);

    // ========================================
    // 🆕 KEY CHANGE: Get appointments with patient_visit data
    // ========================================
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
                pv.visit_id,             -- ✅ Check if patient has checked in
                pv.blood_pressure,       -- ✅ Check if vitals recorded
                pv.temperature,
                pv.created_at as checked_in_at  -- ✅ When patient checked in
            FROM appointment a
            INNER JOIN patient p ON a.Patient_id = p.patient_id
            LEFT JOIN office o ON a.Office_id = o.office_id
            LEFT JOIN patient_visit pv ON pv.appointment_id = a.Appointment_id  -- ✅ Join visit data
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
        // Appointment DateTime in Chicago timezone
        $appointmentDateTime = null;
        try {
            $appointmentDateTime = new DateTime($apt['Appointment_date']);
            $appointmentDateTime->setTimezone($tz);
        } catch (Exception $e) {
            // fallback: create from date only
            $appointmentDateTime = DateTime::createFromFormat('Y-m-d H:i:s', $apt['Appointment_date'], $tz) ?: new DateTime('now', $tz);
        }

        // ========================================
        // Time-based calculation (Chicago timezone)
        // Adds: minutesUntil and computedStatus (derived)
        // Keep DB status in `status` and `dbStatus` for compatibility
        // ========================================
        $status = $apt['Status'] ?? 'Scheduled';

        // minutes until appointment (positive => in future, negative => in past)
        $minutesUntil = (int) floor(($appointmentDateTime->getTimestamp() - $currentDateTime->getTimestamp()) / 60);

        // Compute a derived status based on minutesUntil and DB status
        // Rules (configurable thresholds):
        // - >= 16 minutes: 'upcoming'
        // - between -30 and 15: 'active' (about to start / in-progress)
        // - < -30: 'past'
        if ($minutesUntil >= 16) {
            $computedStatus = 'upcoming';
        } elseif ($minutesUntil >= -30 && $minutesUntil <= 15) {
            $computedStatus = 'active';
        } else {
            $computedStatus = 'past';
        }

        // Calculate waiting time if patient has checked in (minutes)
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
            'status' => $status,  // ✅ REAL status from database
            'dbStatus' => $status,  // Keep for compatibility
            'location' => $apt['office_name'],
            'allergies' => $apt['allergies'] ?: 'No Known Allergies',
            'waitingMinutes' => $waitingTime,
            'visitId' => $apt['visit_id'],
            'hasVitals' => !empty($apt['blood_pressure']) || !empty($apt['temperature']),
            'checkedInAt' => $apt['checked_in_at']
        ];

        // Update stats based on REAL status
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