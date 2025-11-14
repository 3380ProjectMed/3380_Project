<?php

/**
 * Admin API: Update user account
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    //session_start();

    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $conn = getDBConnection();

    // Verify admin
    $checkSql = "SELECT role FROM user_account WHERE user_id = ?";
    $checkRows = executeQuery($conn, $checkSql, 'i', [(int)$_SESSION['uid']]);

    if (empty($checkRows) || $checkRows[0]['role'] !== 'ADMIN') {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);

    $user_id = isset($input['user_id']) ? intval($input['user_id']) : 0;

    if ($user_id === 0) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'user_id is required']);
        exit;
    }

    // Build update query dynamically based on provided fields
    $updates = [];
    $params = [];
    $types = '';

    if (isset($input['username']) && !empty(trim($input['username']))) {
        $updates[] = "username = ?";
        $params[] = trim($input['username']);
        $types .= 's';
    }

    if (isset($input['email']) && !empty(trim($input['email']))) {
        $updates[] = "email = ?";
        $params[] = trim($input['email']);
        $types .= 's';
    }

    if (isset($input['role']) && !empty(trim($input['role']))) {
        $role = strtoupper(trim($input['role']));
        if (!in_array($role, ['PATIENT', 'DOCTOR', 'ADMIN'])) {
            closeDBConnection($conn);
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid role']);
            exit;
        }
        $updates[] = "role = ?";
        $params[] = $role;
        $types .= 's';
    }

    if (isset($input['is_active'])) {
        $updates[] = "is_active = ?";
        $params[] = $input['is_active'] ? 1 : 0;
        $types .= 'i';
    }

    if (isset($input['password']) && !empty($input['password'])) {
        $updates[] = "password_hash = ?";
        $params[] = password_hash($input['password'], PASSWORD_DEFAULT);
        $types .= 's';
    }

    if (empty($updates)) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No fields to update']);
        exit;
    }

    // Add user_id to params
    $params[] = $user_id;
    $types .= 'i';

    $sql = "UPDATE user_account SET " . implode(', ', $updates) . " WHERE user_id = ?";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        closeDBConnection($conn);
        throw new Exception('Prepare failed: ' . $conn->error);
    }

    $stmt->bind_param($types, ...$params);

    if (!$stmt->execute()) {
        $error = $stmt->error;
        $stmt->close();
        closeDBConnection($conn);
        throw new Exception('Update failed: ' . $error);
    }

    $affected = $stmt->affected_rows;
    $stmt->close();
    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'message' => 'User updated successfully',
        'affected_rows' => $affected
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
