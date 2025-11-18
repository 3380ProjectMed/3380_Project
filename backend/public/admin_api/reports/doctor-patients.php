<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

header('Content-Type: application/json');

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
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    $conn = getDBConnection();

    $doctor_id = isset($_GET['doctor_id']) ? (int)$_GET['doctor_id'] : null;
    $start_date = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
    $end_date   = $_GET['end_date']   ?? date('Y-m-d');
    $office_id  = !empty($_GET['office_id']) && $_GET['office_id'] !== 'all'
        ? (int)$_GET['office_id'] : null;
    $status     = $_GET['status'] ?? 'all';

    if (!$doctor_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'doctor_id is required']);
        exit;
    }

    $types  = 'ssi';
    $params = [
        $start_date . ' 00:00:00',
        $end_date   . ' 23:59:59',
        $doctor_id
    ];

    $sql = "SELECT
                p.patient_id,
                CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
                MIN(CASE WHEN a.Status NOT IN ('Cancelled', 'No-Show')
                        THEN a.Appointment_date END) AS first_visit_date,
                MAX(CASE WHEN a.Status NOT IN ('Cancelled', 'No-Show')
                        THEN a.Appointment_date END) AS last_visit_date,
                COUNT(*) AS total_appointments,
                SUM(CASE WHEN a.Status = 'Completed' THEN 1 ELSE 0 END) AS completed_appointments,
                SUM(CASE WHEN a.Status = 'No-Show'  THEN 1 ELSE 0 END) AS no_shows,
                SUM(CASE WHEN a.Status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_appointments,
                CASE
                    WHEN MIN(CASE WHEN a.Status NOT IN ('Cancelled', 'No-Show')
                                THEN a.Appointment_date END) = (
                        SELECT MIN(a2.Appointment_date)
                        FROM appointment a2
                        WHERE a2.Patient_id = a.Patient_id
                        AND a2.Status NOT IN ('Cancelled', 'No-Show')
                    )
                    AND MIN(CASE WHEN a.Status NOT IN ('Cancelled', 'No-Show')
                                THEN a.Appointment_date END)
                        BETWEEN ? AND ?
                    THEN 1 ELSE 0
                END AS is_new_patient,
                CASE
                    WHEN (
                        SELECT COUNT(*)
                        FROM appointment a3
                        WHERE a3.Patient_id = a.Patient_id
                        AND a3.Doctor_id  = a.Doctor_id
                        AND a3.Status NOT IN ('Cancelled', 'No-Show')
                    ) >= 2
                    THEN 1 ELSE 0
                END AS is_retained
            FROM appointment a
            JOIN patient p ON p.patient_id = a.Patient_id
            WHERE a.Appointment_date BETWEEN ? AND ?
            AND a.Doctor_id = ?";

    $types  = 'ssssi';
    $params = [
        $start_date . ' 00:00:00', // for BETWEEN ? AND ? inside is_new_patient
        $end_date   . ' 23:59:59',
        $start_date . ' 00:00:00', // main WHERE range
        $end_date   . ' 23:59:59',
        $doctor_id
    ];

    if ($office_id !== null) {
        $sql   .= " AND a.Office_id = ?";
        $types .= 'i';
        $params[] = $office_id;
    }

    if ($status !== 'all') {
        $sql   .= " AND a.Status = ?";
        $types .= 's';
        $params[] = $status;
    }

    $sql .= "
        GROUP BY p.patient_id, patient_name
        ORDER BY patient_name";


    // extra params for is_new_patient BETWEEN ? AND ?
    $types  = 'ssissi';
    $params = [
        $start_date . ' 00:00:00',
        $end_date   . ' 23:59:59',
        $start_date . ' 00:00:00',
        $end_date   . ' 23:59:59',
        $start_date . ' 00:00:00',
        $end_date   . ' 23:59:59',
        $doctor_id
    ];

    if ($office_id !== null) {
        $sql   .= " AND a.Office_id = ?";
        $types .= 'i';
        $params[] = $office_id;
    }

    if ($status !== 'all') {
        $sql   .= " AND a.Status = ?";
        $types .= 's';
        $params[] = $status;
    }

    $sql .= "
        GROUP BY p.patient_id, patient_name
        ORDER BY patient_name
    ";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }

    bindParams($stmt, $types, $params);
    $stmt->execute();
    $res = $stmt->get_result();
    $patients = $res->fetch_all(MYSQLI_ASSOC);

    echo json_encode([
        'success'  => true,
        'patients' => $patients,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
