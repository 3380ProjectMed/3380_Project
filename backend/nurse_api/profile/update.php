<?php
require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../_bootstrap.php';

try {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!$body) { http_response_code(400); echo json_encode(['error'=>'Invalid body']); exit; }

    $fields = [];
    $types = '';
    $params = [];
    $allowed = ['phone','email','workLocation','work_location'];
    foreach ($allowed as $k) {
        if (isset($body[$k])) {
            $fields[] = ($k === 'workLocation' ? 'work_location' : $k) . ' = ?';
            $types .= 's';
            $params[] = $body[$k];
        }
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No updatable fields provided']);
        exit;
    }

    $sql = 'UPDATE user_account SET ' . implode(', ', $fields) . ' WHERE user_id = ?';
    $types .= 'i';
    $params[] = $userId;

    $stmt = $pdo->prepare($sql);
    if (!$stmt) throw new Exception('Prepare failed: ' . $pdo->error);
    $stmt->bind_param($types, ...$params);
    if (!$stmt->execute()) throw new Exception('Update failed: ' . $stmt->error);
    $stmt->close();

    // return updated profile
    $rows = executeQuery($pdo, 'SELECT email, phone, work_location AS location FROM user_account WHERE user_id = ? LIMIT 1', 'i', [$userId]);
    echo json_encode(['ok' => true, 'profile' => $rows[0] ?? null]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update profile', 'message' => $e->getMessage()]);
}
