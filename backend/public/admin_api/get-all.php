<?php
/**
 * Admin API: list all user accounts
 * Requires ADMIN session role
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

    $conn = getDBConnection();

    $sql = "SELECT user_id, username, email, role, is_active, created_at FROM user_account ORDER BY username";
    $rows = executeQuery($conn, $sql, '', []);

    $users = array_map(function($r){
        return [
            'id' => (int)$r['user_id'],
            'username' => $r['username'] ?? '',
            'email' => $r['email'] ?? '',
            'role' => $r['role'] ?? '',
            'is_active' => (int)($r['is_active'] ?? 0),
            'created_at' => $r['created_at'] ?? null
        ];
    }, $rows ?: []);

    closeDBConnection($conn);
    echo json_encode(['success' => true, 'users' => $users]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
