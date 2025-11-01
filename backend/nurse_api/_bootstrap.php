<?php
require_once __DIR__ . '/../lib/db.php';
/**
 * Nurse API bootstrap
 * Loads DB and authentication, validates JWT or session and exposes $pdo, $userId, $role
 */
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../database.php';

try {
    // Prefer JWT auth via ../lib/auth.php when available
    $userId = 0;
    $role = '';

    if (file_exists(__DIR__ . '/../lib/auth.php')) {
        require_once __DIR__ . '/../lib/auth.php';
        // Assume lib/auth.php provides getBearerToken() and verifyToken()
        $token = getBearerToken();
        $claims = verifyToken($token);
        $userId = (int)($claims['uid'] ?? 0);
        $role = $claims['role'] ?? '';
        if (!$userId || !in_array($role, ['NURSE', 'ADMIN'], true)) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
        // create DB connection
        $pdo = getDBConnection();
    } else {
        // Fallback to session-based auth (mirror existing doctor_api behavior)
        session_start();
        if (empty($_SESSION['uid'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        $userId = (int)$_SESSION['uid'];
        // Try to resolve role from user_account table
        $conn = getDBConnection();
        $rows = executeQuery($conn, 'SELECT role FROM user_account WHERE user_id = ? LIMIT 1', 'i', [$userId]);
        if (!empty($rows)) {
            $role = $rows[0]['role'];
        }
        if (!$userId || !in_array($role, ['NURSE', 'ADMIN'], true)) {
            closeDBConnection($conn);
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
        $pdo = $conn;
    }

} catch (Throwable $e) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized', 'message' => $e->getMessage()]);
    exit;
}

// Helper: send JSON and exit
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    if (isset($GLOBALS['pdo'])) {
        // close if it's mysqli
        if (is_resource($GLOBALS['pdo'])) {
            // noop
        }
    }
    exit;
}

?>
