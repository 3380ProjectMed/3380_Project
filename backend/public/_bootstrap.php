<?php
declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/../../database.php'; // exposes getDBConnection()
require_once __DIR__ . '/../../cors.php';

session_start();

try {
    $pdo = getDBConnection(); // mysqli instance

    // Resolve user from session
    $userId = isset($_SESSION['uid']) ? (int)$_SESSION['uid'] : 0;
    if ($userId <= 0) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    // role + email
    $u = $pdo->prepare('SELECT role, email FROM user_account WHERE user_id = ? LIMIT 1');
    $u->bind_param('i', $userId);
    $u->execute();
    $userRow = $u->get_result()->fetch_assoc();
    $u->close();

    if (!$userRow) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    $role = $userRow['role'] ?? '';
    $email = $userRow['email'] ?? '';

    if (!in_array($role, ['NURSE', 'ADMIN'], true)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    $nurseOfficeId = null;
    if (!empty($email)) {
        $q = $pdo->prepare('SELECT s.work_location AS office_id FROM staff s WHERE s.staff_email = ? LIMIT 1');
        $q->bind_param('s', $email);
        $q->execute();
        $row = $q->get_result()->fetch_assoc();
        $q->close();
        if ($row && isset($row['office_id'])) {
            $nurseOfficeId = (int)$row['office_id'];
        }
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Bootstrap failed', 'message' => $e->getMessage()]);
    exit;
}
