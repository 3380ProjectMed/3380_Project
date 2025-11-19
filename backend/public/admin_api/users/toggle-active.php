<?php
// /admin_api/users/toggle-active.php
declare(strict_types=1);

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

header('Content-Type: application/json');

try {
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        throw new RuntimeException('Invalid JSON payload');
    }

    $userId   = isset($input['user_id']) ? (int)$input['user_id'] : 0;
    $userType = $input['user_type'] ?? '';
    $isActive = isset($input['is_active']) ? (int)$input['is_active'] : null;

    if ($userId <= 0 || $userType === '' || $isActive === null) {
        throw new RuntimeException('Missing required fields');
    }

    $conn = getDBConnection();

    $sql = "UPDATE user_account 
            SET is_active = ? 
            WHERE user_id = ? AND role = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('iis', $isActive, $userId, $userType);

    if (!$stmt->execute()) {
        throw new RuntimeException('Database error updating status');
    }

    echo json_encode([
        'success' => true,
        'user_id' => $userId,
        'is_active' => $isActive
    ]);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ]);
}
