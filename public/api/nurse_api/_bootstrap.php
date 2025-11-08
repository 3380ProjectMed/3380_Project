<?php
// public/api/nurse_api/_bootstrap.php
header('Content-Type: application/json');
session_start();

// Load PDO helper from backend
// Note: backend/lib/db.php exposes $pdo (PDO)
require_once __DIR__ . '/../../../backend/lib/db.php';

// Minimal executeQuery wrapper that works with PDO and mirrors existing usage
function executeQuery($pdo, $sql, $types = null, $params = []) {
    if (!$pdo) throw new Exception('PDO not initialized');
    $stmt = $pdo->prepare($sql);
    if ($stmt === false) {
        throw new Exception('Failed to prepare statement');
    }

    // execute with params array (ignore $types - kept for compatibility)
    $ok = $stmt->execute($params ?: []);
    if ($ok === false) {
        $err = $stmt->errorInfo();
        throw new Exception('Query failed: ' . ($err[2] ?? 'unknown'));
    }

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Resolve session-based user
$userId = isset($_SESSION['uid']) ? intval($_SESSION['uid']) : null;
$role = $_SESSION['role'] ?? null;
$userEmail = $_SESSION['email'] ?? null;

if (empty($userId) || empty($userEmail)) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Derive nurseOfficeId (may be null)
$nurseOfficeId = null;
try {
    $sql = "SELECT s.work_location AS officeId FROM user_account ua LEFT JOIN staff s ON s.staff_email = ua.email WHERE ua.user_id = ? LIMIT 1";
    $rows = executeQuery($pdo, $sql, 'i', [$userId]);
    if (!empty($rows) && !empty($rows[0]['officeId'])) {
        $nurseOfficeId = (int)$rows[0]['officeId'];
    }
} catch (Throwable $e) {
    // ignore office resolution failures; nurseOfficeId stays null
    error_log('nurse bootstrap office lookup failed: ' . $e->getMessage());
}

// Expose variables to including scripts
// $pdo, $userId, $role, $nurseOfficeId
