<?php
/**
 * Admin API: create a new user account
 * Expects JSON body with: username, email, password, role (optional), is_active (optional)
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

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $username = trim($input['username'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = (string)($input['password'] ?? '');
    $role = trim($input['role'] ?? 'USER');
    $is_active = isset($input['is_active']) ? (int)$input['is_active'] : 1;

    if ($username === '' || $email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'username, email and password required']);
        exit;
    }

    $conn = getDBConnection();

    // Check for existing email
    $exists = executeQuery($conn, 'SELECT user_id FROM user_account WHERE email = ? LIMIT 1', 's', [$email]);
    if (is_array($exists) && count($exists) > 0) {
        closeDBConnection($conn);
        echo json_encode(['success' => false, 'error' => 'Email already in use']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $sql = 'INSERT INTO user_account (username, email, password_hash, role, is_active, created_at) VALUES (?, ?, ?, ?, ?, NOW())';
    $stmt = $conn->prepare($sql);
    if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
    $stmt->bind_param('sssii', $username, $email, $hash, $role, $is_active);
    if (!$stmt->execute()) throw new Exception('Insert failed: ' . $stmt->error);
    $newId = $conn->insert_id;
    $stmt->close();

    closeDBConnection($conn);
    echo json_encode(['success' => true, 'user_id' => (int)$newId]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
