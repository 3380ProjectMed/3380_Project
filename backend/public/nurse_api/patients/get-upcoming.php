<?php
// nurse_api/patients/get-upcoming.php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
    session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['error' => 'UNAUTHENTICATED', 'message' => 'Please sign in']);
        exit;
    }

    $user_id = (int)$_SESSION['uid'];
    $q = isset($_GET['q']) ? trim($_GET['q']) : '';
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 200;
    $limit = max(1, min(500, $limit));

    $conn = getDBConnection();

    // resolve office for this nurse
    $rows = executeQuery($conn, "SELECT s.work_location AS office_id
                                 FROM user_account u
                                 JOIN staff s ON s.staff_email = u.email
                                 JOIN nurse n ON n.staff_id = s.staff_id
                                 WHERE u.user_id = ? AND u.is_active = 1 LIMIT 1", 'i', [$user_id]);
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['error' => 'NURSE_NOT_FOUND', 'message' => 'No nurse record is associated with this account.']);
        exit;
    }

    $office_id = (int)$rows[0]['office_id'];

    $params = [$office_id];
    $types = 'i';

    $sql = "SELECT DISTINCT p.patient_id,
                   CONCAT(p.first_name, ' ', p.last_name) AS name,
                   DATE_FORMAT(p.dob, '%Y-%m-%d') AS dob,
                   ca.allergies_text AS allergies
            FROM patient p
            LEFT JOIN codes_allergies ca ON ca.allergies_code = p.allergies
            JOIN appointment a ON a.patient_id = p.patient_id
            WHERE a.office_id = ?
              AND a.appointment_date >= CURDATE()
              AND a.appointment_date < DATE_ADD(CURDATE(), INTERVAL 30 DAY)";

    if ($q !== '') {
        $sql .= " AND (p.first_name LIKE CONCAT('%',?,'%') OR p.last_name LIKE CONCAT('%',?,'%') OR CAST(p.patient_id AS CHAR) LIKE CONCAT('%',?,'%') OR p.email LIKE CONCAT('%',?,'%'))";
        $params[] = $q; $params[] = $q; $params[] = $q; $params[] = $q;
        $types .= 'ssss';
    }

    $sql .= " GROUP BY p.patient_id, name, p.dob, allergies ORDER BY name ASC LIMIT ?";
    $types .= 'i';
    $params[] = $limit;

    $patients = executeQuery($conn, $sql, $types, $params);

    foreach ($patients as &$p) {
        if ($p['allergies'] === null) $p['allergies'] = 'None';
        $p['patient_id'] = (int)$p['patient_id'];
    }

    closeDBConnection($conn);
    echo json_encode($patients);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB_ERROR', 'message' => $e->getMessage()]);
    exit;
}

?>
