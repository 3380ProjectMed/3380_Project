<?php
// Public nurse API: patients/get-all.php
// Returns patients visible to the nurse identified by the requesting user's email.

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

    $conn = getDBConnection();

    // Resolve nurse_id from session email
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
        echo json_encode(['error' => 'NURSE_NOT_FOUND', 'message' => 'No nurse record found']);
        exit;
    }

    $nurse_id = (int)$rows[0]['nurse_id'];

    // Get pagination and search params
    $search = $_GET['q'] ?? '';
    $page = max(1, (int)($_GET['page'] ?? 1));
    $pageSize = max(1, min(100, (int)($_GET['limit'] ?? 10)));
    $offset = ($page - 1) * $pageSize;

    // Get patients assigned to this nurse via patient_visit
    $sql = "SELECT DISTINCT
                p.patient_id,
                p.first_name,
                p.last_name,
                p.dob,
                p.email,
                ca.allergies_text as allergies,
                MAX(pv.date) as last_visit_date
            FROM patient_visit pv
            JOIN patient p ON pv.patient_id = p.patient_id
            LEFT JOIN codes_allergies ca ON p.allergies = ca.allergies_code
            WHERE pv.nurse_id = ?";
    
    $params = [$nurse_id];
    $types = 'i';

    // Add search filter if provided
    if (!empty($search)) {
        $sql .= " AND (p.first_name LIKE ? OR p.last_name LIKE ? OR p.email LIKE ?)";
        $searchParam = "%{$search}%";
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
        $types .= 'sss';
    }

    $sql .= " GROUP BY p.patient_id ORDER BY p.last_name, p.first_name LIMIT ? OFFSET ?";
    $params[] = $pageSize;
    $params[] = $offset;
    $types .= 'ii';

    $patients = executeQuery($conn, $sql, $types, $params);

    // Get total count
    $countSql = "SELECT COUNT(DISTINCT p.patient_id) as total
                 FROM patient_visit pv
                 JOIN patient p ON pv.patient_id = p.patient_id
                 WHERE pv.nurse_id = ?";
    
    $countParams = [$nurse_id];
    $countTypes = 'i';

    if (!empty($search)) {
        $countSql .= " AND (p.first_name LIKE ? OR p.last_name LIKE ? OR p.email LIKE ?)";
        $countParams[] = $searchParam;
        $countParams[] = $searchParam;
        $countParams[] = $searchParam;
        $countTypes .= 'sss';
    }

    $countResult = executeQuery($conn, $countSql, $countTypes, $countParams);
    $total = (int)($countResult[0]['total'] ?? 0);

    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'patients' => $patients,
        'total' => $total,
        'page' => $page,
        'pageSize' => $pageSize
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB_ERROR', 'message' => $e->getMessage()]);
    exit;
}
?>

