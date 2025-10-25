<?php
/**
 * Admin API: update existing user
 * Accepts JSON body with: user_id (required), username, email, password (optional), role, is_active
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
    $id = isset($input['user_id']) ? intval($input['user_id']) : 0;
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'user_id required']);
        exit;
    }

    $conn = getDBConnection();

    // Build update parts
    $fields = [];
    $types = '';
    $values = [];

    if (isset($input['username'])) { $fields[] = 'username = ?'; $types .= 's'; $values[] = $input['username']; }
    if (isset($input['email']))    { $fields[] = 'email = ?'; $types .= 's'; $values[] = $input['email']; }
    if (isset($input['role']))     { $fields[] = 'role = ?'; $types .= 's'; $values[] = $input['role']; }
    if (isset($input['is_active'])){ $fields[] = 'is_active = ?'; $types .= 'i'; $values[] = (int)$input['is_active']; }
    if (isset($input['password']) && $input['password'] !== '') {
        $hash = password_hash($input['password'], PASSWORD_BCRYPT);
        $fields[] = 'password_hash = ?'; $types .= 's'; $values[] = $hash;
    }

    if (count($fields) === 0) {
        closeDBConnection($conn);
        echo json_encode(['success' => false, 'error' => 'No fields to update']);
        exit;
    }

    $sql = 'UPDATE user_account SET ' . implode(', ', $fields) . ' WHERE user_id = ?';
    $types .= 'i';
    $values[] = $id;

    $stmt = $conn->prepare($sql);
    if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
    $stmt->bind_param($types, ...$values);
    if (!$stmt->execute()) throw new Exception('Update failed: ' . $stmt->error);
    $affected = $stmt->affected_rows;
    $stmt->close();

    closeDBConnection($conn);
    echo json_encode(['success' => true, 'affected' => $affected]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
