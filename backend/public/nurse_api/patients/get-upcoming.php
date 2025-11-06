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

    $q = isset($_GET['q']) ? trim($_GET['q']) : '';
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 200;
    $limit = max(1, min(500, $limit));

    $conn = getDBConnection();

    // resolve nurse_id from the logged-in session email
    $email = $_SESSION['email'] ?? '';
    if (empty($email)) {
        closeDBConnection($conn);
        http_response_code(401);
        echo json_encode(['error' => 'UNAUTHENTICATED', 'message' => 'Please sign in']);
        exit;
    }

    $rows = executeQuery($conn, "SELECT n.nurse_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1", 's', [$email]);
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['error' => 'NURSE_NOT_FOUND', 'message' => 'No nurse record is associated with this account.']);
        exit;
    }

    $nurse_id = (int)$rows[0]['nurse_id'];

    $params = [$nurse_id];
    $types = 'i';

    $sql = "SELECT DISTINCT p.patient_id, p.first_name, p.last_name, DATE_FORMAT(p.dob, '%Y-%m-%d') AS dob, ca.allergies_text AS allergies, MAX(pv.date) AS last_visit
            FROM patient_visit pv
            JOIN patient p ON pv.patient_id = p.patient_id
            LEFT JOIN codes_allergies ca ON p.allergies = ca.allergies_code
            WHERE pv.nurse_id = ?";

    if ($q !== '') {
        $sql .= " AND (p.first_name LIKE CONCAT('%',?,'%') OR p.last_name LIKE CONCAT('%',?,'%') OR CAST(p.patient_id AS CHAR) LIKE CONCAT('%',?,'%') OR p.email LIKE CONCAT('%',?,'%'))";
        $params[] = $q; $params[] = $q; $params[] = $q; $params[] = $q;
        $types .= 'ssss';
    }

    $sql .= " GROUP BY p.patient_id, p.first_name, p.last_name, p.dob, ca.allergies_text ORDER BY last_visit DESC LIMIT ?";
    $types .= 'i';
    $params[] = $limit;

    $patients = executeQuery($conn, $sql, $types, $params);

    foreach ($patients as &$p) {
        if ($p['allergies'] === null) $p['allergies'] = 'None';
        $p['patient_id'] = (int)$p['patient_id'];
        $p['last_visit'] = $p['last_visit'] ?? null;
    }

    closeDBConnection($conn);
    echo json_encode(['patients' => $patients]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB_ERROR', 'message' => $e->getMessage()]);
    exit;
}

?>
