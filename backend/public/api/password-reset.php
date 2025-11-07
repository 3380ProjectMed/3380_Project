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
// HANDLE PASSWORD RESET WITH SSN VERIFICATION
// ==========================================
if ($action === 'reset') {
    if (!isset($input['email']) || !isset($input['ssn']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email, SSN, and password required']);
        exit;
    }

    $email = $input['email'];
    $ssn = $input['ssn'];
    $newPassword = $input['password'];

    // Validate password strength
    if (strlen($newPassword) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 8 characters']);
        exit;
    }

    // Validate SSN format (9 digits)
    if (!preg_match('/^\d{9}$/', $ssn)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid SSN format']);
        exit;
    }

    // Verify SSN matches patient with this email
    $stmt = $mysqli->prepare(
        "SELECT p.patient_id, p.email 
         FROM patient p
         WHERE p.email = ? 
         AND p.ssn = ? 
         LIMIT 1"
    );
    $stmt->bind_param('ss', $email, $ssn);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        // Don't reveal which field is wrong - security best practice
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials. Email and SSN do not match our records.']);
        $stmt->close();
        $mysqli->close();
        exit;
    }

    $patient = $result->fetch_assoc();
    $stmt->close();

    // Now find the user_account with this email
    $userStmt = $mysqli->prepare(
        "SELECT user_id 
         FROM user_account 
         WHERE email = ? 
         LIMIT 1"
    );
    $userStmt->bind_param('s', $email);
    $userStmt->execute();
    $userResult = $userStmt->get_result();

    if ($userResult->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'User account not found']);
        $userStmt->close();
        $mysqli->close();
        exit;
    }

    $userAccount = $userResult->fetch_assoc();
    $userStmt->close();

    // Hash new password
    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);

    // Update password and reset failed_login_count to unlock the account
    $updateStmt = $mysqli->prepare(
        "UPDATE user_account 
         SET password_hash = ?, 
             failed_login_count = 0,
             updated_at = NOW() 
         WHERE user_id = ?"
    );
    $updateStmt->bind_param('si', $passwordHash, $userAccount['user_id']);
    $updateStmt->execute();
    
    if ($updateStmt->affected_rows === 0) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update password']);
        $updateStmt->close();
        $mysqli->close();
        exit;
    }
    
    $updateStmt->close();

    // Log the password reset for security audit
    error_log("Password reset successful for user: {$email}");

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