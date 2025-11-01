<?php
// Public nurse API: patients/get-all.php
// Returns patients visible to the nurse identified by the requesting user's email.

require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
    // Accept email from X-User-Email header or query param for flexibility
    $email = $_SERVER['HTTP_X_USER_EMAIL'] ?? ($_GET['email'] ?? null);
    $q = isset($_GET['q']) ? trim($_GET['q']) : '';
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    $limit = max(1, min(200, $limit));

    if (empty($email)) {
        http_response_code(400);
        echo json_encode(['error' => 'MISSING_EMAIL', 'message' => 'Missing X-User-Email header or email query param']);
        exit;
    }

    $conn = getDBConnection();

    // Resolve nurse record from user_account -> staff -> nurse
    $sql = "SELECT n.nurse_id, s.staff_id, s.work_location AS office_id
            FROM user_account u
            JOIN staff s ON s.staff_email = u.email
            JOIN nurse n ON n.staff_id = s.staff_id
            WHERE u.email = ? AND u.role = 'NURSE' AND u.is_active = 1";

    $rows = executeQuery($conn, $sql, 's', [$email]);
    if (count($rows) === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'NURSE_NOT_FOUND', 'message' => 'No nurse record is associated with this account.']);
        closeDBConnection($conn);
        exit;
    }

    $n = $rows[0];
    $nurse_id = (int)$n['nurse_id'];
    $staff_id = (int)$n['staff_id'];
    $office_id = (int)$n['office_id'];

    // Build patient query: patients who have appointments at the nurse's office
    // within a 7-day lookback and next 30 days window. Support optional search q.
    $params = [$office_id];
    $types = 'i';

    $sql = "SELECT DISTINCT p.patient_id,
                   CONCAT(p.first_name, ' ', p.last_name) AS name,
                   DATE_FORMAT(p.dob, '%Y-%m-%d') AS dob,
                   ca.allergies_text AS allergies,
                   MIN(a.appointment_date) AS upcoming
            FROM patient p
            LEFT JOIN codes_allergies ca ON ca.allergies_code = p.allergies
            LEFT JOIN appointment a ON a.patient_id = p.patient_id
            WHERE a.office_id = ?
              AND a.appointment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
              AND a.appointment_date < DATE_ADD(CURDATE(), INTERVAL 30 DAY)";

    if ($q !== '') {
        $sql .= " AND (p.first_name LIKE CONCAT('%',?,'%') OR p.last_name LIKE CONCAT('%',?,'%') OR CAST(p.patient_id AS CHAR) LIKE CONCAT('%',?,'%') OR p.email LIKE CONCAT('%',?,'%'))";
        $params[] = $q; $params[] = $q; $params[] = $q; $params[] = $q;
        $types .= 'ssss';
    }

    $sql .= " GROUP BY p.patient_id, name, p.dob, allergies
              ORDER BY upcoming IS NULL, upcoming ASC
              LIMIT ?";
    $types .= 'i';
    $params[] = $limit;

    $patients = executeQuery($conn, $sql, $types, $params);

    // Normalize results
    foreach ($patients as &$p) {
        if ($p['allergies'] === null) $p['allergies'] = 'None';
        if (!empty($p['upcoming'])) {
            // Convert to ISO 8601 for frontend convenience
            $p['upcoming'] = date(DATE_ATOM, strtotime($p['upcoming']));
        } else {
            $p['upcoming'] = null;
        }
        $p['patient_id'] = (int)$p['patient_id'];
    }

    $response = [
        'nurse' => [ 'nurse_id' => $nurse_id, 'staff_id' => $staff_id, 'office_id' => $office_id ],
        'patients' => $patients,
    ];

    echo json_encode($response);
    closeDBConnection($conn);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB_ERROR', 'message' => $e->getMessage()]);
    exit;
}

