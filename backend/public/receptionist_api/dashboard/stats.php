<?php
/**
 * Get dashboard statistics for receptionist's office
 * IMPROVED VERSION: Uses intelligent time-based status calculation
 * 
 * DATABASE SCHEMA NOTES:
 * - staff.work_location -> office.office_id (receptionist's office)
 * - appointment.Patient_id -> patient.patient_id (case-sensitive join)
 * - appointment.Doctor_id -> doctor.doctor_id
 * - appointment.Office_id -> office.office_id
 * - patient_visit.start_at = check-in time
 * - patient_visit.end_at = completion time
 * - patient_visit.payment = payment amount
 * 
 * TEST DATA DATES (for Office 3 - Memorial Park Healthcare):
 * - 2024-01-16: Has appointment 1007 (Patient 4, Doctor 4)
 * - Most other appointments are at Office 1, 2, or 4
 * - To test with data, use date parameter: ?date=2024-01-16
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

    $user_id = (int) $_SESSION['uid'];

    // Resolve the receptionist's office ID
    $conn = getDBConnection();

    try {
        $rows = executeQuery($conn, '
            SELECT s.work_location as office_id, o.name as office_name, o.address, o.phone
            FROM staff s
            JOIN user_account ua ON ua.email = s.staff_email
            JOIN office o ON s.work_location = o.office_id
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

    $office_id = (int) $rows[0]['office_id'];
    $office_name = $rows[0]['office_name'];
    $office_address = $rows[0]['address'] ?? null;
    $office_phone = $rows[0]['phone'] ?? null;

    // Use America/Chicago timezone
    $tz = new DateTimeZone('America/Chicago');
    $currentDateTime = new DateTime('now', $tz);

    // Get date parameter or use today's date
    $date = isset($_GET['date']) ? $_GET['date'] : $currentDateTime->format('Y-m-d');

    // Validate date format
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid date format. Use YYYY-MM-DD']);
        exit;
    }

    // Get all appointments for the date
    // Schema notes: appointment.Patient_id joins to patient.patient_id (case difference)
    // patient_visit uses start_at and end_at for check-in and completion times
    $appointmentsSql = "SELECT
                            a.Appointment_id,
                            a.Appointment_date,
                            a.Status,
                            a.Reason_for_visit,
                            a.Patient_id,
                            pv.visit_id,
                            pv.start_at as check_in_time,
                            pv.end_at as completion_time,
                            pv.payment,
                            d.doctor_id,
                            CONCAT(doc_staff.first_name, ' ', doc_staff.last_name) as doctor_name,
                            CONCAT(p.first_name, ' ', p.last_name) as patient_name
                        FROM appointment a
                        INNER JOIN patient p ON a.Patient_id = p.patient_id
                        INNER JOIN doctor d ON a.Doctor_id = d.doctor_id
                        LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
                        LEFT JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id
                        WHERE a.Office_id = ?
                        AND DATE(a.Appointment_date) = ?
                        ORDER BY a.Appointment_date";

    $appointments = executeQuery($conn, $appointmentsSql, 'is', [$office_id, $date]);

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

    $payment_count = 0;
    $total_collected = 0.0;
    $doctor_stats = [];

    // Process each appointment
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

        // Count checked in (based on patient_visit records)
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

        // Track payment statistics
        if ($apt['payment'] && $apt['payment'] > 0) {
            $payment_count++;
            $total_collected += (float) $apt['payment'];
        }

        // Track doctor statistics
        if ($apt['doctor_id']) {
            $doctor_id = $apt['doctor_id'];
            if (!isset($doctor_stats[$doctor_id])) {
                $doctor_stats[$doctor_id] = [
                    'id' => $doctor_id,
                    'name' => $apt['doctor_name'],
                    'appointments' => 0,
                    'completed' => 0
                ];
            }
            $doctor_stats[$doctor_id]['appointments']++;
            if ($displayStatus === 'Completed') {
                $doctor_stats[$doctor_id]['completed']++;
            }
        }
    }

    $stats['total'] = count($appointments);

    // Calculate completion rate
    $active_appointments = $stats['total'] - $stats['cancelled'] - $stats['no_show'];
    $completion_rate = $active_appointments > 0 ? round(($stats['completed'] / $active_appointments) * 100, 1) : 0;

    closeDBConnection($conn);

    // Format response
    $response = [
        'success' => true,
        'stats' => [
            'total' => $stats['total'],
            'scheduled' => $stats['scheduled'],
            'upcoming' => $stats['upcoming'],
            'checked_in' => $stats['checked_in'],
            'waiting' => $stats['waiting'],
            'in_progress' => $stats['in_progress'],
            'completed' => $stats['completed'],
            'cancelled' => $stats['cancelled'],
            'no_show' => $stats['no_show'],
            'completion_rate' => $completion_rate,
            'payment' => [
                'count' => $payment_count,
                'total_collected' => number_format($total_collected, 2),
                'total_collected_raw' => $total_collected
            ]
        ],
        'office' => [
            'id' => $office_id,
            'name' => $office_name,
            'address' => $office_address,
            'phone' => $office_phone
        ],
        'date' => $date,
        'currentTime' => $currentDateTime->format('Y-m-d H:i:s'),
        'timezone' => 'America/Chicago'
    ];

    // Add doctor statistics if available
    if (!empty($doctor_stats)) {
        $response['doctors'] = array_values($doctor_stats);
    }

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>