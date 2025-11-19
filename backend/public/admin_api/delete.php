<?php

/**
 * Admin API: deactivate (soft-delete) a user
 * Accepts `user_id` (POST JSON) or `user_id` param
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    //session_start();
    if (empty($_SESSION['uid']) || ($_SESSION['role'] ?? '') !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Forbidden']);
        exit;
    }

    // Accept POST JSON or query param
    $rawInput = json_decode(file_get_contents('php://input'), true);
    $id = null;
    if (is_array($rawInput) && isset($rawInput['user_id'])) $id = intval($rawInput['user_id']);
    if ($id === null) {
        $id = isset($_POST['user_id']) ? intval($_POST['user_id']) : (isset($_GET['user_id']) ? intval($_GET['user_id']) : 0);
    }

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'user_id required']);
        exit;
    }

    $conn = getDBConnection();

    // Soft-delete by setting is_active = 0
    $stmt = $conn->prepare('UPDATE user_account SET is_active = 0 WHERE user_id = ?');
    if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
    $stmt->bind_param('i', $id);
    if (!$stmt->execute()) throw new Exception('Delete failed: ' . $stmt->error);
    $affected = $stmt->affected_rows;
    $stmt->close();

    closeDBConnection($conn);
    echo json_encode(['success' => true, 'affected' => $affected]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
