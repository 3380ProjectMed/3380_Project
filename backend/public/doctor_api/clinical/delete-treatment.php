<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

header('Content-Type: application/json');

try {
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $user_id = (int) $_SESSION['uid'];

    // Verify 
    $conn = getDBConnection();
    $rows = executeQuery($conn, '
        SELECT s.staff_id 
        FROM staff s
        JOIN user_account ua ON ua.email = s.staff_email
        WHERE ua.user_id = ?', 'i', [$user_id]);

    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied - doctors only']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $visit_id = isset($input['visit_id']) ? intval($input['visit_id']) : 0;
    $treatments = isset($input['treatments']) ? $input['treatments'] : [];

    if ($visit_id === 0) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'visit_id required']);
        exit;
    }

    if (!is_array($treatments) || empty($treatments)) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'At least one treatment required']);
        exit;
    }

    $visitCheck = executeQuery(
        $conn,
        'SELECT visit_id FROM patient_visit WHERE visit_id = ?',
        'i',
        [$visit_id]
    );

    if (empty($visitCheck)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Visit not found']);
        exit;
    }

    $conn->begin_transaction();

    try {
        $deleted_count = 0;
        $skipped_count = 0;

        foreach ($treatments as $treatment) {
            $treatment_id = intval(is_array($treatment) ? ($treatment['treatment_id'] ?? 0) : $treatment);

            if ($treatment_id <= 0) {
                $skipped_count++;
                continue;
            }

            $checkSql = "SELECT visit_treatment_id FROM treatment_per_visit 
                        WHERE visit_id = ? AND treatment_id = ? 
                        LIMIT 1";
            $existing = executeQuery($conn, $checkSql, 'ii', [$visit_id, $treatment_id]);

            if (empty($existing)) {
                $skipped_count++;
                continue;
            }

            $deleteSql = "DELETE FROM treatment_per_visit WHERE visit_id = ? AND treatment_id = ?";
            executeQuery($conn, $deleteSql, 'ii', [$visit_id, $treatment_id]);
            $deleted_count++;
        }

        $conn->commit();
        closeDBConnection($conn);

        $message = 'Treatments deleted successfully';
        if ($deleted_count === 0 && $skipped_count > 0) {
            $message = 'No matching treatments found to delete';
        } elseif ($deleted_count > 0 && $skipped_count > 0) {
            $message = "$deleted_count deleted, $skipped_count skipped";
        }

        echo json_encode([
            'success' => true,
            'message' => $message,
            'deleted_count' => $deleted_count,
            'skipped_count' => $skipped_count
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        closeDBConnection($conn);
        throw $e;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>