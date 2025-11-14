<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {
    //session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['error' => 'UNAUTHENTICATED']);
        exit;
    }

    $conn = getDBConnection();
    $email = $_SESSION['email'] ?? '';

    $rows = executeQuery($conn, "SELECT n.nurse_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1", 's', [$email]);

    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['error' => 'NURSE_NOT_FOUND']);
        exit;
    }

    $nurse_id = (int)$rows[0]['nurse_id'];

    $search = $_GET['q'] ?? '';
    $page = max(1, (int)($_GET['page'] ?? 1));
    $pageSize = max(1, min(100, (int)($_GET['limit'] ?? 10)));
    $offset = ($page - 1) * $pageSize;

    if (!empty($search)) {
        $searchParam = "%{$search}%";
        // Fixed: Use explicit column names without ambiguity
        $sql = "SELECT DISTINCT 
                    patient.patient_id, 
                    patient.first_name, 
                    patient.last_name, 
                    DATE_FORMAT(patient.dob, '%Y-%m-%d') AS dob, 
                    patient.email, 
                    codes_allergies.allergies_text as allergies
                FROM patient_visit
                JOIN patient ON patient_visit.patient_id = patient.patient_id
                LEFT JOIN codes_allergies ON patient.allergies = codes_allergies.allergies_code
                WHERE patient_visit.nurse_id = ? 
                AND (patient.first_name LIKE ? OR patient.last_name LIKE ?)
                ORDER BY patient.last_name, patient.first_name
                LIMIT ? OFFSET ?";

        $patients = executeQuery($conn, $sql, 'issii', [$nurse_id, $searchParam, $searchParam, $pageSize, $offset]);

        $countSql = "SELECT COUNT(DISTINCT patient.patient_id) as total 
                     FROM patient_visit 
                     JOIN patient ON patient_visit.patient_id = patient.patient_id 
                     WHERE patient_visit.nurse_id = ? 
                     AND (patient.first_name LIKE ? OR patient.last_name LIKE ?)";
        $countResult = executeQuery($conn, $countSql, 'iss', [$nurse_id, $searchParam, $searchParam]);
    } else {
        // Fixed: Use explicit table names
        $sql = "SELECT DISTINCT 
                    patient.patient_id, 
                    patient.first_name, 
                    patient.last_name, 
                    DATE_FORMAT(patient.dob, '%Y-%m-%d') AS dob, 
                    patient.email, 
                    codes_allergies.allergies_text as allergies
                FROM patient_visit
                JOIN patient ON patient_visit.patient_id = patient.patient_id
                LEFT JOIN codes_allergies ON patient.allergies = codes_allergies.allergies_code
                WHERE patient_visit.nurse_id = ?
                ORDER BY patient.last_name, patient.first_name
                LIMIT ? OFFSET ?";

        $patients = executeQuery($conn, $sql, 'iii', [$nurse_id, $pageSize, $offset]);

        $countSql = "SELECT COUNT(DISTINCT patient_visit.patient_id) as total 
             FROM patient_visit 
             WHERE patient_visit.nurse_id = ?";
        $countResult = executeQuery($conn, $countSql, 'i', [$nurse_id]);
    }

    $total = (int)($countResult[0]['total'] ?? 0);

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'patients' => $patients ?: [],
        'total' => $total,
        'page' => $page,
        'pageSize' => $pageSize
    ]);
} catch (Throwable $e) {
    error_log("Nurse patients ERROR: " . $e->getMessage());

    if (isset($conn)) {
        closeDBConnection($conn);
    }

    http_response_code(500);
    echo json_encode([
        'error' => 'SERVER_ERROR',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
