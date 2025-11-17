<?php
//office-utilization.php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Admin access required',
            'debug' => [
                'session_active' => session_status() === PHP_SESSION_ACTIVE,
                'session_id' => session_id(),
                'has_uid' => isset($_SESSION['uid']),
                'uid_value' => $_SESSION['uid'] ?? 'not set',
                'role_value' => $_SESSION['role'] ?? 'not set',
                'session_keys' => array_keys($_SESSION ?? []),
                'cookie_exists' => isset($_COOKIE[session_name()])
            ]
        ]);
        exit;
    }

    $conn = getDBConnection();

    // Fetch role from DB using uid
    $userRows = executeQuery(
        $conn,
        "SELECT role FROM user_account WHERE user_id = ?",
        "i",
        [$_SESSION['uid']]
    );

    $userRole = $userRows[0]['role'] ?? null;

    if ($userRole !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        closeDBConnection($conn);
        exit;
    }

    // Get and validate parameters
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-d', strtotime('-30 days'));
    $end_date = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d');
    $office_id = isset($_GET['office_id']) ? $_GET['office_id'] : null;
    $status_filter = isset($_GET['status']) ? $_GET['status'] : null;

    // Validate dates
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid date format. Use YYYY-MM-DD']);
        exit;
    }

    // Build WHERE clause for appointment filters
    $where_conditions = ["DATE(a.Appointment_date) BETWEEN ? AND ?"];
    $params = [$start_date, $end_date];
    $param_types = 'ss';

    if ($office_id && $office_id !== 'all') {
        $where_conditions[] = "a.Office_id = ?";
        $params[] = $office_id;
        $param_types .= 'i';
    }

    if ($status_filter && $status_filter !== 'all') {
        $where_conditions[] = "a.Status = ?";
        $params[] = $status_filter;
        $param_types .= 's';
    }

    $where_clause = count($where_conditions) > 0 ? 'WHERE ' . implode(' AND ', $where_conditions) : '';

    // Office statistics with detailed appointment breakdown
    $sql = "SELECT 
                    o.office_id,
                    o.name as office_name,
                    CONCAT(o.address, ', ', o.city, ', ', o.state, ' ', o.zipcode) as address,
                    o.city,
                    o.state,
                    o.phone,
                    COUNT(a.Appointment_id) as total_appointments,
                    COUNT(CASE WHEN a.Status = 'Completed' THEN 1 END) as completed,
                    COUNT(CASE WHEN a.Status = 'Cancelled' THEN 1 END) as cancelled,
                    COUNT(CASE WHEN a.Status = 'No-Show' THEN 1 END) as no_shows,
                    COUNT(CASE WHEN a.Status = 'Scheduled' THEN 1 END) as scheduled,
                    COUNT(CASE WHEN a.Status = 'Waiting' THEN 1 END) as waiting,
                    ROUND(
                        COUNT(CASE WHEN a.Status = 'No-Show' THEN 1 END) * 100.0 / 
                        NULLIF(COUNT(a.Appointment_id), 0),
                        1
                    ) as no_show_rate,
                    ROUND(
                        COUNT(CASE WHEN a.Status = 'Completed' THEN 1 END) * 100.0 / 
                        NULLIF(COUNT(a.Appointment_id), 0),
                        1
                    ) as completion_rate,
                    ROUND(AVG(
                        CASE 
                            WHEN pv.Start_at IS NOT NULL 
                                AND a.Appointment_date IS NOT NULL
                                AND pv.Start_at >= a.Appointment_date
                                AND TIMESTAMPDIFF(MINUTE, a.Appointment_date, pv.Start_at) BETWEEN 0 AND 240
                            THEN TIMESTAMPDIFF(MINUTE, a.Appointment_date, pv.Start_at)
                            ELSE NULL
                        END
                    ), 0) as avg_wait_minutes,
                    ROUND(
                        COUNT(a.Appointment_id) * 100.0 / 
                        NULLIF(DATEDIFF(?, ?) + 1, 0),
                        1
                    ) as utilization_rate,
                    COUNT(DISTINCT a.Doctor_id) as unique_doctors,
                    COUNT(DISTINCT a.Patient_id) as unique_patients
                FROM office o
                LEFT JOIN Appointment a ON o.office_id = a.Office_id 
                    AND DATE(a.Appointment_date) BETWEEN ? AND ?
                    " . ($status_filter && $status_filter !== 'all' ? "AND a.Status = ?" : "") . "
                LEFT JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id
                " . ($office_id && $office_id !== 'all' ? "WHERE o.office_id = ?" : "") . "
                GROUP BY o.office_id, o.name, o.address, o.city, o.state, o.phone, o.zipcode
                HAVING total_appointments > 0
                ORDER BY total_appointments DESC";

    // Prepare parameters for the query
    $query_params = [$end_date, $start_date, $start_date, $end_date];
    $query_types = 'ssss';

    if ($status_filter && $status_filter !== 'all') {
        $query_params[] = $status_filter;
        $query_types .= 's';
    }

    if ($office_id && $office_id !== 'all') {
        $query_params[] = $office_id;
        $query_types .= 'i';
    }

    $office_stats = executeQuery($conn, $sql, $query_types, $query_params);

    // Calculate summary statistics
    $total_offices = count($office_stats);
    $active_offices = $total_offices;
    $total_appointments = 0;
    $total_completed = 0;
    $total_no_shows = 0;
    $total_cancelled = 0;
    $sum_wait_time = 0;
    $wait_time_count = 0;

    foreach ($office_stats as $office) {
        $total_appointments += intval($office['total_appointments']);
        $total_completed    += intval($office['completed']);
        $total_no_shows     += intval($office['no_shows']);
        $total_cancelled    += intval($office['cancelled']);

        if (!is_null($office['avg_wait_minutes'])) {
            $sum_wait_time += floatval($office['avg_wait_minutes']);
            $wait_time_count++;
        }
    }
    $sum_utilization = 0.0;
    foreach ($office_stats as &$office) {
        $office_appts = intval($office['total_appointments']);
        $office['utilization_rate'] = $total_appointments > 0
            ? round($office_appts * 100.0 / $total_appointments, 1)
            : 0.0;

        $sum_utilization += $office['utilization_rate'];
    }
    unset($office);

    $avg_utilization = $total_offices > 0
        ? round($sum_utilization / $total_offices, 1)
        : 0.0;
    $avg_no_show_rate = $total_appointments > 0 ? round(($total_no_shows / $total_appointments) * 100, 1) : 0;
    $avg_wait_time = $wait_time_count > 0 ? round($sum_wait_time / $wait_time_count, 0) : null;
    $completion_rate = $total_appointments > 0 ? round(($total_completed / $total_appointments) * 100, 1) : 0;

    // Get daily appointment trends
    $sql = "SELECT 
                    DATE(a.Appointment_date) as appointment_date,
                    COUNT(*) as total_appointments,
                    COUNT(CASE WHEN a.Status = 'Completed' THEN 1 END) as completed,
                    COUNT(CASE WHEN a.Status = 'No-Show' THEN 1 END) as no_shows,
                    COUNT(CASE WHEN a.Status = 'Cancelled' THEN 1 END) as cancelled
                FROM Appointment a
                $where_clause
                GROUP BY DATE(a.Appointment_date)
                ORDER BY appointment_date DESC";

    $daily_trends = executeQuery($conn, $sql, $param_types, $params);

    // Get status breakdown
    $sql = "SELECT 
                    a.Status,
                    COUNT(*) AS count,
                    ROUND(
                        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (),
                        1
                    ) AS percentage
                FROM Appointment a
                $where_clause
                GROUP BY a.Status
                ORDER BY count DESC";

    $status_breakdown = executeQuery($conn, $sql, $param_types, $params);

    $summary = [
        'total_offices'      => $total_offices,
        'active_offices'     => $active_offices,
        'total_appointments' => $total_appointments,
        'completed'          => $total_completed,
        'cancelled'          => $total_cancelled,
        'no_shows'           => $total_no_shows,
        'avg_utilization'    => $avg_utilization,
        'no_show_rate'       => $avg_no_show_rate,
        'avg_wait_minutes'   => $avg_wait_time,
        'completion_rate'    => $completion_rate
    ];

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'start_date' => $start_date,
        'end_date' => $end_date,
        'filters' => [
            'office_id' => $office_id,
            'status' => $status_filter
        ],
        'summary' => $summary,
        'office_stats' => $office_stats,
        'daily_trends' => $daily_trends,
        'status_breakdown' => $status_breakdown
    ], JSON_NUMERIC_CHECK);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
