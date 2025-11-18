<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

header('Content-Type: application/json');

/**
 * Helper to bind params to a mysqli_stmt using type string + array of values.
 */
function bindParams(mysqli_stmt $stmt, string $types, array $params): void
{
    $bindParams = array_merge([$types], $params);
    $refs = [];
    foreach ($bindParams as $k => $v) {
        $refs[$k] = &$bindParams[$k];
    }
    call_user_func_array([$stmt, 'bind_param'], $refs);
}

try {
    // ── Auth check ─────────────────────────────────────────────────────────────
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    $conn = getDBConnection();

    // ── Params ────────────────────────────────────────────────────────────────
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-d', strtotime('-30 days'));
    $end_date   = isset($_GET['end_date'])   ? $_GET['end_date']   : date('Y-m-d');
    $group_by   = isset($_GET['group_by'])   ? $_GET['group_by']   : 'week';

    $allowed_group = ['day', 'week', 'month'];
    if (!in_array($group_by, $allowed_group, true)) {
        $group_by = 'week';
    }

    $office_id = !empty($_GET['office_id']) && $_GET['office_id'] !== 'all' ? (int)$_GET['office_id'] : null;
    $doctor_id = !empty($_GET['doctor_id']) && $_GET['doctor_id'] !== 'all' ? (int)$_GET['doctor_id'] : null;

    // ── Period expression for trend grouping ──────────────────────────────────
    switch ($group_by) {
        case 'month':
            $periodExpr = "DATE_FORMAT(a.Appointment_date, '%Y-%m-01')";
            break;
        case 'week':
            $periodExpr = "DATE_SUB(DATE(a.Appointment_date), INTERVAL (WEEKDAY(a.Appointment_date)) DAY)";
            break;
        case 'day':
        default:
            $periodExpr = "DATE(a.Appointment_date)";
            break;
    }

    // Base types/params used for date/office/doctor filters
    $types  = 'ss';
    $params = [$start_date . ' 00:00:00', $end_date . ' 23:59:59'];

    if ($office_id !== null) {
        $types   .= 'i';
        $params[] = $office_id;
    }
    if ($doctor_id !== null) {
        $types   .= 'i';
        $params[] = $doctor_id;
    }

    // =========================================================================
    // 1. DOCTOR PERFORMANCE SUMMARY
    // =========================================================================
    $doctorSql = "SELECT
                        d.doctor_id,
                        CONCAT(s.first_name, ' ', s.last_name) AS doctor_name,
                        COUNT(DISTINCT CASE 
                            WHEN a.Appointment_date = (
                                SELECT MIN(a2.Appointment_date)
                                FROM appointment a2
                                WHERE a2.Patient_id = a.Patient_id
                                AND a2.Status NOT IN ('Cancelled', 'No-Show')
                            )
                            AND a.Status NOT IN ('Cancelled', 'No-Show')
                            THEN a.Patient_id 
                        END) AS new_patients_acquired,

                        COUNT(DISTINCT a.Patient_id) AS total_patients_seen,
                        
                        SUM(CASE 
                            WHEN a.Appointment_date = (
                                SELECT MIN(a2.Appointment_date)
                                FROM appointment a2
                                WHERE a2.Patient_id = a.Patient_id
                                AND a2.Status NOT IN ('Cancelled', 'No-Show')
                            )
                            AND a.Status NOT IN ('Cancelled', 'No-Show')
                            THEN 1 ELSE 0 
                        END) AS new_patient_appointments,
                        
                        COUNT(DISTINCT CASE
                            WHEN a.Appointment_date = (
                                SELECT MIN(a2.Appointment_date)
                                FROM appointment a2
                                WHERE a2.Patient_id = a.Patient_id
                                AND a2.Status NOT IN ('Cancelled', 'No-Show')
                            )
                            AND (
                                SELECT COUNT(*)
                                FROM appointment a3
                                WHERE a3.Patient_id = a.Patient_id
                                AND a3.Status NOT IN ('Cancelled', 'No-Show')
                            ) >= 2
                            THEN a.Patient_id
                        END) AS retained_patients,
                        
                        SUM(CASE WHEN a.Status = 'Completed' THEN 1 ELSE 0 END) AS total_completed
                        
                    FROM appointment a
                    JOIN doctor d ON d.doctor_id = a.Doctor_id
                    JOIN staff s ON s.staff_id = d.staff_id
                    WHERE a.Appointment_date BETWEEN ? AND ?";

    if ($office_id !== null) {
        $doctorSql .= " AND a.Office_id = ?";
    }
    if ($doctor_id !== null) {
        $doctorSql .= " AND a.Doctor_id = ?";
    }

    $doctorSql .= " GROUP BY d.doctor_id, doctor_name
                    ORDER BY new_patients_acquired DESC";

    $stmt = $conn->prepare($doctorSql);
    if (!$stmt) {
        throw new Exception('Prepare failed (doctor): ' . $conn->error);
    }
    bindParams($stmt, $types, $params);
    $stmt->execute();
    $result            = $stmt->get_result();
    $doctorPerformance = $result->fetch_all(MYSQLI_ASSOC);

    // Calculate retention and avg visits
    foreach ($doctorPerformance as &$doc) {
        $newPatients = (int)$doc['new_patients_acquired'];
        $retained    = (int)$doc['retained_patients'];

        $doc['retention_rate'] = $newPatients > 0
            ? round(($retained / $newPatients) * 100, 1)
            : 0;

        $totalSeen = (int)$doc['total_patients_seen'];
        $doc['avg_visits_per_patient'] = $totalSeen > 0
            ? round((int)$doc['total_completed'] / $totalSeen, 1)
            : 0;
    }
    unset($doc);

    // =========================================================================
    // 2. TREND DATA (New Patients Over Time by Doctor)
    // =========================================================================
    $trendSql = "SELECT
                    $periodExpr AS period_start,
                    d.doctor_id,
                    CONCAT(s.first_name, ' ', s.last_name) AS doctor_name,
                    COUNT(DISTINCT CASE 
                        WHEN a.Appointment_date = (
                            SELECT MIN(a2.Appointment_date)
                            FROM appointment a2
                            WHERE a2.Patient_id = a.Patient_id
                            AND a2.Status NOT IN ('Cancelled', 'No-Show')
                        )
                        AND a.Status NOT IN ('Cancelled', 'No-Show')
                        THEN a.Patient_id 
                    END) AS new_patients
                FROM appointment a
                JOIN doctor d ON d.doctor_id = a.Doctor_id
                JOIN staff s ON s.staff_id = d.staff_id
                WHERE a.Appointment_date BETWEEN ? AND ?";

    if ($office_id !== null) {
        $trendSql .= " AND a.Office_id = ?";
    }
    if ($doctor_id !== null) {
        $trendSql .= " AND a.Doctor_id = ?";
    }

    $trendSql .= " GROUP BY period_start, d.doctor_id, doctor_name
                   ORDER BY period_start, doctor_name";

    $stmt2 = $conn->prepare($trendSql);
    if (!$stmt2) {
        throw new Exception('Prepare failed (trend): ' . $conn->error);
    }
    bindParams($stmt2, $types, $params);
    $stmt2->execute();
    $result2  = $stmt2->get_result();
    $trendData = $result2->fetch_all(MYSQLI_ASSOC);

    // Add period labels for frontend
    foreach ($trendData as &$row) {
        $date = new DateTime($row['period_start']);
        if ($group_by === 'month') {
            $row['period_label'] = $date->format('M Y');
        } elseif ($group_by === 'week') {
            $row['period_label'] = 'Week of ' . $date->format('M d');
        } else {
            $row['period_label'] = $date->format('M d');
        }
    }
    unset($row);

    // =========================================================================
    // 3. OFFICE BREAKDOWN
    // =========================================================================
    $officeSql = "SELECT
                        o.office_id,
                        o.name AS office_name,
                        COUNT(DISTINCT CASE 
                            WHEN a.Appointment_date = (
                                SELECT MIN(a2.Appointment_date)
                                FROM appointment a2
                                WHERE a2.Patient_id = a.Patient_id
                                AND a2.Status NOT IN ('Cancelled', 'No-Show')
                            )
                            AND a.Status NOT IN ('Cancelled', 'No-Show')
                            THEN a.Patient_id 
                        END) AS new_patients,
                        COUNT(DISTINCT a.Patient_id) AS total_patients
                    FROM appointment a
                    JOIN office o ON o.office_id = a.Office_id
                    WHERE a.Appointment_date BETWEEN ? AND ?";

    if ($office_id !== null) {
        $officeSql .= " AND a.Office_id = ?";
    }
    if ($doctor_id !== null) {
        $officeSql .= " AND a.Doctor_id = ?";
    }

    $officeSql .= " GROUP BY o.office_id, office_name
                    ORDER BY new_patients DESC";

    $stmt3 = $conn->prepare($officeSql);
    if (!$stmt3) {
        throw new Exception('Prepare failed (office): ' . $conn->error);
    }
    bindParams($stmt3, $types, $params);
    $stmt3->execute();
    $result3        = $stmt3->get_result();
    $officeBreakdown = $result3->fetch_all(MYSQLI_ASSOC);

    // =========================================================================
    // 3b. BOOKING METHOD BREAKDOWN
    // =========================================================================
    $bookingSql = "SELECT
                        a.method,
                        COUNT(DISTINCT CASE 
                            WHEN a.Appointment_date = (
                                SELECT MIN(a2.Appointment_date)
                                FROM appointment a2
                                WHERE a2.Patient_id = a.Patient_id
                                AND a2.Status NOT IN ('Cancelled', 'Waiting', 'No-Show')
                            )
                            AND a.Status NOT IN ('Cancelled', 'Waiting', 'No-Show')
                            THEN a.Patient_id 
                        END) AS new_patients,
                        COUNT(*) AS total_appointments,
                        SUM(CASE WHEN a.Status = 'Completed' THEN 1 ELSE 0 END) AS completed_appointments,
                        COUNT(DISTINCT a.Patient_id) AS unique_patients
                    FROM appointment a
                    WHERE a.Appointment_date BETWEEN ? AND ?";

    if ($office_id !== null) {
        $bookingSql .= " AND a.Office_id = ?";
    }
    if ($doctor_id !== null) {
        $bookingSql .= " AND a.Doctor_id = ?";
    }

    $bookingSql .= " GROUP BY a.method
                     ORDER BY new_patients DESC";

    $stmt5 = $conn->prepare($bookingSql);
    if (!$stmt5) {
        throw new Exception('Prepare failed (booking): ' . $conn->error);
    }
    bindParams($stmt5, $types, $params);
    $stmt5->execute();
    $result5         = $stmt5->get_result();
    $bookingBreakdown = $result5->fetch_all(MYSQLI_ASSOC);

    $topMethod           = 'N/A';
    $topMethodNewPatients = 0;
    foreach ($bookingBreakdown as $row) {
        $newCount = (int)$row['new_patients'];
        if ($newCount > $topMethodNewPatients) {
            $topMethodNewPatients = $newCount;
            $topMethod            = $row['method'];
        }
    }

    // =========================================================================
    // 4. SUMMARY METRICS
    // =========================================================================
    $totalNewPatients      = array_sum(array_column($doctorPerformance, 'new_patients_acquired'));
    $totalRetained         = array_sum(array_column($doctorPerformance, 'retained_patients'));
    $avgRetentionRate      = $totalNewPatients > 0 ? round(($totalRetained / $totalNewPatients) * 100, 1) : 0;
    $totalPatientsInPeriod = array_sum(array_column($doctorPerformance, 'total_patients_seen'));

    // Previous period comparison (ensure at least 1-day period)
    $dayDiff      = (int)floor((strtotime($end_date) - strtotime($start_date)) / 86400);
    $periodLength = max(1, $dayDiff);

    $prev_start = date('Y-m-d', strtotime($start_date . " -$periodLength days"));
    $prev_end   = date('Y-m-d', strtotime($end_date   . " -$periodLength days"));

    $prevSql = "SELECT COUNT(DISTINCT CASE 
                    WHEN a.Appointment_date = (
                        SELECT MIN(a2.Appointment_date)
                        FROM appointment a2
                        WHERE a2.Patient_id = a.Patient_id
                        AND a2.Status NOT IN ('Cancelled', 'No-Show')
                    )
                    AND a.Status NOT IN ('Cancelled', 'No-Show')
                    THEN a.Patient_id 
                END) AS prev_new_patients
                FROM appointment a
                WHERE a.Appointment_date BETWEEN ? AND ?";

    $prevTypes  = 'ss';
    $prevParams = [$prev_start . ' 00:00:00', $prev_end . ' 23:59:59'];

    if ($office_id !== null) {
        $prevSql    .= " AND a.Office_id = ?";
        $prevTypes  .= 'i';
        $prevParams[] = $office_id;
    }
    if ($doctor_id !== null) {
        $prevSql    .= " AND a.Doctor_id = ?";
        $prevTypes  .= 'i';
        $prevParams[] = $doctor_id;
    }

    $stmt4 = $conn->prepare($prevSql);
    if (!$stmt4) {
        throw new Exception('Prepare failed (previous period): ' . $conn->error);
    }
    bindParams($stmt4, $prevTypes, $prevParams);
    $stmt4->execute();
    $result4    = $stmt4->get_result();
    $prevData   = $result4->fetch_assoc();
    $prevNewPatients = (int)($prevData['prev_new_patients'] ?? 0);

    $growthRate = 0;
    if ($prevNewPatients > 0) {
        $growthRate = round((($totalNewPatients - $prevNewPatients) / $prevNewPatients) * 100, 1);
    } elseif ($totalNewPatients > 0) {
        $growthRate = 100;
    }

    $summary = [
        'total_new_patients'        => $totalNewPatients,
        'total_retained_patients'   => $totalRetained,
        'avg_retention_rate'        => $avgRetentionRate,
        'total_unique_patients'     => $totalPatientsInPeriod, // sum of per-doctor uniques
        'growth_rate'               => $growthRate,
        'prev_period_new_patients'  => $prevNewPatients,
        'top_doctor'                => !empty($doctorPerformance) ? $doctorPerformance[0]['doctor_name'] : 'N/A',
        'top_doctor_count'          => !empty($doctorPerformance) ? $doctorPerformance[0]['new_patients_acquired'] : 0,
        'top_booking_method'        => $topMethod,
        'top_booking_method_count'  => $topMethodNewPatients,
    ];

    echo json_encode([
        'success'            => true,
        'summary'            => $summary,
        'doctor_performance' => $doctorPerformance,
        'trend_data'         => $trendData,
        'office_breakdown'   => $officeBreakdown,
        'booking_breakdown'  => $bookingBreakdown,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
