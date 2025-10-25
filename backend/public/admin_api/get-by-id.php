<?php
/**
 * Admin API: get user by id
 * Accepts `id` (numeric) or `user_id` param
 */
require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../database.php';

try {
    session_start();
    if (empty($_SESSION['uid']) || ($_SESSION['role'] ?? '') !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Forbidden']);
        exit;
    }

    $raw = isset($_GET['user_id']) ? $_GET['user_id'] : (isset($_GET['id']) ? $_GET['id'] : null);
    if (!$raw) {
        throw new Exception('user_id or id required');
    }

    $numeric = intval(preg_replace('/[^0-9]/', '', $raw));
    if ($numeric <= 0) throw new Exception('Invalid user id');

    $conn = getDBConnection();
    $sql = "SELECT user_id, username, email, role, is_active, created_at FROM user_account WHERE user_id = ? LIMIT 1";
    $rows = executeQuery($conn, $sql, 'i', [$numeric]);
    if (!is_array($rows) || count($rows) === 0) {
        closeDBConnection($conn);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }

    $r = $rows[0];
    $user = [
        'id' => (int)$r['user_id'],
        'username' => $r['username'] ?? '',
        'email' => $r['email'] ?? '',
        'role' => $r['role'] ?? '',
        'is_active' => (int)($r['is_active'] ?? 0),
        'created_at' => $r['created_at'] ?? null
    ];

    closeDBConnection($conn);
    echo json_encode(['success' => true, 'user' => $user]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
