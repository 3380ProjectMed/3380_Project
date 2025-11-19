<?php
header('Content-Type: application/json');
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

// session_start();
if (empty($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['error' => 'UNAUTHENTICATED']);
    exit;
}

$conn = getDBConnection();
// $email = $_SESSION['email'] ?? '';
$rows = executeQuery($conn, "SELECT n.nurse_id FROM nurse n WHERE n.staff_id =  ? LIMIT 1", 'i', [$_SESSION['uid']]);
if (empty($rows)) {
    closeDBConnection($conn);
    http_response_code(404);
    echo json_encode(['error' => 'NURSE_NOT_FOUND']);
    exit;
}
$nurse_id = (int)$rows[0]['nurse_id'];

try {
    $date = $_GET['date'] ?? date('Y-m-d');
    $status = $_GET['status'] ?? null;
    $q = $_GET['q'] ?? null;

    $sql = "SELECT a.Appointment_id AS id, a.Appointment_date AS time, a.Status AS status, a.Reason_for_visit AS reason,
                p.patient_id AS patientId, CONCAT(p.first_name,' ',p.last_name) AS patientName
            FROM appointment a
            JOIN patient p ON p.patient_id = a.Patient_id
            JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id
           WHERE DATE(a.Appointment_date) = ? AND pv.nurse_id = ?";

    $types = 'si';
    $params = [$date, $nurse_id];

    if ($status) {
        $sql .= " AND a.Status = ?";
        $types .= 's';
        $params[] = $status;
    }
    if ($q) {
        $sql .= " AND (p.first_name LIKE ? OR p.last_name LIKE ? OR p.patient_id LIKE ? )";
        $types .= 'sss';
        $like = "%{$q}%";
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }

    $sql .= " ORDER BY a.Appointment_date ASC";

    $rows = executeQuery($conn, $sql, $types, $params);

    $out = [];
    foreach ($rows as $r) {
        $out[] = [
            'id' => (int)$r['id'],
            'time' => $r['time'],
            'status' => $r['status'],
            'reason' => $r['reason'],
            'patientId' => 'p' . $r['patientId'],
            'patientName' => $r['patientName']
        ];
    }

    closeDBConnection($conn);
    echo json_encode($out);
} catch (Throwable $e) {
    closeDBConnection($conn);
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load schedule', 'message' => $e->getMessage()]);
}
