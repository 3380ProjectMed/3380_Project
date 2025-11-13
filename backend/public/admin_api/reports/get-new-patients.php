<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

header('Content-Type: application/json');

try {
    session_start();
    
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }
    
    $conn = getDBConnection(); // <-- mysqli

    // ---- Get & sanitize params ----
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-d', strtotime('-30 days'));
    $end_date   = isset($_GET['end_date'])   ? $_GET['end_date']   : date('Y-m-d');
    $group_by   = isset($_GET['group_by'])   ? $_GET['group_by']   : 'day';

    // normalize group_by to what SQL expects
    $allowed_group = ['day','week','month','year'];
    if (!in_array($group_by, $allowed_group)) {
        $group_by = 'day';
    }

    // optional filters
    $office_id   = !empty($_GET['office_id'])   && $_GET['office_id'] !== 'all'   ? (int)$_GET['office_id']   : null;
    $doctor_id   = !empty($_GET['doctor_id'])   && $_GET['doctor_id'] !== 'all'   ? (int)$_GET['doctor_id']   : null;

    // ---- Build period expression in SQL (no params needed for this) ----
    switch ($group_by) {
        case 'year':
            $periodExpr = "DATE_FORMAT(a.Appointment_date, '%Y-01-01')";
            break;
        case 'month':
            $periodExpr = "DATE_FORMAT(a.Appointment_date, '%Y-%m-01')";
            break;
        case 'week':
            // start of week (Monday)
            $periodExpr = "DATE_SUB(DATE(a.Appointment_date), INTERVAL (WEEKDAY(a.Appointment_date)) DAY)";
            break;
        case 'day':
        default:
            $periodExpr = "DATE(a.Appointment_date)";
            break;
    }

    // ---- Base SQL with positional ? placeholders ----
    $sql = "
        SELECT
            $periodExpr AS period_start,

            d.doctor_id,
            CONCAT(s.first_name, ' ', s.last_name) AS doctor_name,

            o.office_id,
            o.name AS office_name,

            COUNT(*) AS new_patient_appointments,
            COUNT(DISTINCT a.Patient_id) AS unique_new_patients
        FROM appointment a
        JOIN patient p      ON p.patient_id = a.Patient_id
        JOIN doctor d       ON d.doctor_id = a.Doctor_id
        JOIN staff s        ON s.staff_id = d.staff_id
        JOIN office o       ON o.office_id = a.Office_id
        WHERE
            a.Appointment_date BETWEEN ? AND ?
            AND a.Status NOT IN ('Cancelled', 'No-Show')
            AND a.Appointment_date = (
                SELECT MIN(a2.Appointment_date)
                FROM appointment a2
                WHERE a2.Patient_id = a.Patient_id
                  AND a2.Status NOT IN ('Cancelled', 'No-Show')
            )
    ";

    // dynamic filters
    $types  = 'ss'; // start_date, end_date
    $params = [];
    $params[] = $start_date . ' 00:00:00';
    $params[] = $end_date   . ' 23:59:59';

    if ($office_id !== null) {
        $sql    .= " AND a.Office_id = ?";
        $types  .= 'i';
        $params[] = $office_id;
    }
    if ($doctor_id !== null) {
        $sql    .= " AND a.Doctor_id = ?";
        $types  .= 'i';
        $params[] = $doctor_id;
    }

    $sql .= "
        GROUP BY
            period_start,
            d.doctor_id,
            doctor_name,
            o.office_id,
            office_name
        ORDER BY
            period_start,
            doctor_name,
            office_name
    ";

    // ---- Prepare & bind (mysqli) ----
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }

    // bind_param requires references
    $bindParams = array_merge([$types], $params);
    // convert to references for call_user_func_array
    $refs = [];
    foreach ($bindParams as $k => $v) {
        $refs[$k] = &$bindParams[$k];
    }

    call_user_func_array([$stmt, 'bind_param'], $refs);

    if (!$stmt->execute()) {
        throw new Exception('Execute failed: ' . $stmt->error);
    }

    $result = $stmt->get_result();
    if (!$result) {
        throw new Exception('get_result failed: ' . $stmt->error);
    }

    $rows = $result->fetch_all(MYSQLI_ASSOC);

    // Add a nicer label for the period the way your React likes it
    foreach ($rows as &$r) {
        $date = new DateTime($r['period_start']);
        if ($group_by === 'year') {
            $r['period_label'] = $date->format('Y');
        } elseif ($group_by === 'month') {
            $r['period_label'] = $date->format('M Y');
        } elseif ($group_by === 'week') {
            $r['period_label'] = 'Week of ' . $date->format('Y-m-d');
        } else {
            $r['period_label'] = $date->format('Y-m-d');
        }
    }
    unset($r);

    // Summary (rough aggregate)
    $total_new_appointments = 0;
    $total_unique_bucketed  = 0;
    $seenBuckets = [];

    foreach ($rows as $r) {
        $total_new_appointments += (int)$r['new_patient_appointments'];
        // bucket by (period, doctor, office) just to avoid double counting identical rows
        $bucketKey = $r['period_start'] . '|' . $r['doctor_id'] . '|' . $r['office_id'];
        if (!isset($seenBuckets[$bucketKey])) {
            $seenBuckets[$bucketKey] = true;
            $total_unique_bucketed += (int)$r['unique_new_patients'];
        }
    }

    $summary = [
        'total_new_appointments' => $total_new_appointments,
        'unique_new_patients'    => $total_unique_bucketed
    ];

    echo json_encode([
        'success' => true,
        'summary' => $summary,
        'rows'    => $rows
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
