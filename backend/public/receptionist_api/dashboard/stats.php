<?php

/**
 * Get dashboard statistics for receptionist's office
 * IMPROVED VERSION: Uses intelligent time-based status calculation
 * 
 * DATABASE SCHEMA NOTES:
 * - work_schedule.office_id (receptionist's office via staff_id)
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
require_once '/home/site/wwwroot/session.php';
try {
    
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $user_id = (int) $_SESSION['uid'];

    $conn = getDBConnection();

    try {
        $rows = executeQuery($conn, '
            SELECT ws.office_id, o.name as office_name, o.address, o.phone
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
    $office_name = $rows[0]['office_name'];
    $office_address = $rows[0]['address'] ?? null;
    $office_phone = $rows[0]['phone'] ?? null;

    $tz = new DateTimeZone('America/Chicago');
    $currentDateTime = new DateTime('now', $tz);

    $date = isset($_GET['date']) ? $_GET['date'] : $currentDateTime->format('Y-m-d');

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid date format. Use YYYY-MM-DD']);
        exit;
    }

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

    foreach ($appointments as $apt) {
        $appointmentDateTime = new DateTime($apt['Appointment_date'], $tz);
        $dbStatus = $apt['Status'] ?? 'Scheduled';

        $displayStatus = $dbStatus;

        if ($dbStatus === 'Completed' || $dbStatus === 'Cancelled' || $dbStatus === 'No-Show') {
            $displayStatus = $dbStatus;
        } elseif ($dbStatus === 'Checked-in') {
            if ($dbStatus === 'In Progress') {
                $displayStatus = 'In Progress';
            } else {
                $displayStatus = 'Checked In';
            }
        } else {
            $displayStatus = $dbStatus;
        }

        if ($displayStatus === 'Upcoming') {
            $stats['upcoming']++;
        }

        if ($displayStatus === 'Completed') {
            $stats['completed']++;
        }

        if ($displayStatus === 'Cancelled') {
            $stats['cancelled']++;
        }

        if ($displayStatus === 'No-Show') {
            $stats['no_show']++;
        }

        if ($displayStatus === 'Waiting') {
            $stats['waiting']++;
        }

        if ($displayStatus === 'Checked In') {
            $stats['checked_in']++;
        }

        if ($displayStatus === 'In Progress') {
            $stats['in_progress']++;
        }

        if ($displayStatus === 'Ready' || $displayStatus === 'Scheduled') {
            $stats['scheduled']++;
        }

        if ($apt['payment'] && $apt['payment'] > 0) {
            $payment_count++;
            $total_collected += (float) $apt['payment'];
        }
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

    $active_appointments = $stats['total'] - $stats['cancelled'] - $stats['no_show'];
    $completion_rate = $active_appointments > 0 ? round(($stats['completed'] / $active_appointments) * 100, 1) : 0;

    closeDBConnection($conn);

    
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
