<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../../error.log');

require_once __DIR__ . '/../cors.php';

header('Content-Type: application/json');

// Database connection
$host = getenv('AZURE_MYSQL_HOST') ?: 'medconnect-db.mysql.database.azure.com';
$user = getenv('AZURE_MYSQL_USERNAME') ?: 'aad_mysql_medapp';
$pass = getenv('AZURE_MYSQL_PASSWORD') ?: 'QuinnRocks!';
$db   = getenv('AZURE_MYSQL_DBNAME') ?: 'med-app-db';
$port = (int)(getenv('AZURE_MYSQL_PORT') ?: '3306');

// Initialize mysqli
$mysqli = mysqli_init();
if (!$mysqli) {
    http_response_code(500);
    echo json_encode(['error' => 'Database initialization failed']);
    exit;
}

// Set SSL options
$sslCertPath = '/home/site/wwwroot/certs/DigiCertGlobalRootG2.crt';
if (file_exists($sslCertPath)) {
    $mysqli->ssl_set(NULL, NULL, $sslCertPath, NULL, NULL);
    $mysqli->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, 1);
} else {
    $mysqli->ssl_set(NULL, NULL, NULL, NULL, NULL);
    $mysqli->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, 0);
}

// Connect
if (!@$mysqli->real_connect($host, $user, $pass, $db, $port, NULL, MYSQLI_CLIENT_SSL)) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$mysqli->set_charset('utf8mb4');

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['action'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Action required']);
    exit;
}

$action = $input['action'];

// ==========================================
// HANDLE PASSWORD RESET REQUEST
// ==========================================
if ($action === 'request') {
    if (!isset($input['email'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email required']);
        exit;
    }

    $email = $input['email'];

    // Find user
    $stmt = $mysqli->prepare("SELECT user_id, username, email FROM user_account WHERE email = ? LIMIT 1");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        // Don't reveal if email exists - security best practice
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'If an account exists, reset email sent']);
        $stmt->close();
        $mysqli->close();
        exit;
    }

    $user = $result->fetch_assoc();
    $stmt->close();

    // Generate secure reset token
    $resetToken = bin2hex(random_bytes(32));
    $tokenExpires = date('Y-m-d H:i:s', strtotime('+1 hour'));

    // Store token in database
    $updateStmt = $mysqli->prepare(
        "UPDATE user_account 
         SET reset_token = ?, 
             reset_token_expires = ?, 
             updated_at = NOW() 
         WHERE user_id = ?"
    );
    $updateStmt->bind_param('ssi', $resetToken, $tokenExpires, $user['user_id']);
    $updateStmt->execute();
    $updateStmt->close();

    // Generate reset link
    $resetLink = "https://yourdomain.com/password-reset.html?token=" . $resetToken;
    
    // Log for testing (in production, send actual email)
    error_log("Password reset link for {$email}: {$resetLink}");

    // TODO: Send email in production
    // mail($email, "Password Reset", "Click here to reset: $resetLink");

    $mysqli->close();

    http_response_code(200);
    echo json_encode([
        'success' => true, 
        'message' => 'If an account exists, reset email sent',
        // REMOVE THIS IN PRODUCTION - only for testing:
        'debug_reset_link' => $resetLink
    ]);
    exit;
}

// ==========================================
// HANDLE PASSWORD RESET
// ==========================================
if ($action === 'reset') {
    if (!isset($input['token']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Token and password required']);
        exit;
    }

    $token = $input['token'];
    $newPassword = $input['password'];

    // Validate password strength
    if (strlen($newPassword) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 8 characters']);
        exit;
    }

    // Find user with valid token
    $stmt = $mysqli->prepare(
        "SELECT user_id, email 
         FROM user_account 
         WHERE reset_token = ? 
         AND reset_token_expires > NOW() 
         LIMIT 1"
    );
    $stmt->bind_param('s', $token);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired reset token']);
        $stmt->close();
        $mysqli->close();
        exit;
    }

    $user = $result->fetch_assoc();
    $stmt->close();

    // Hash new password
    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);

    // Update password and clear reset token
    // Also reset failed_login_count to unlock the account
    $updateStmt = $mysqli->prepare(
        "UPDATE user_account 
         SET password_hash = ?, 
             reset_token = NULL, 
             reset_token_expires = NULL,
             failed_login_count = 0,
             updated_at = NOW() 
         WHERE user_id = ?"
    );
    $updateStmt->bind_param('si', $passwordHash, $user['user_id']);
    $updateStmt->execute();
    $updateStmt->close();

    $mysqli->close();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Password has been reset successfully'
    ]);
    exit;
}

// Invalid action
http_response_code(400);
echo json_encode(['error' => 'Invalid action']);
?>