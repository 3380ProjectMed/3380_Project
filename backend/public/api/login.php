<?php
// public/api/login.php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../../error.log');

require_once __DIR__ . '/../cors.php';

session_start([
  'cookie_httponly' => true,
  'cookie_secure'   => !empty($_SERVER['HTTPS']),
  'cookie_samesite' => 'Lax',
]);

header('Content-Type: application/json');

$host = getenv('AZURE_MYSQL_HOST') ?: 'medconnect-db.mysql.database.azure.com';
$user = getenv('AZURE_MYSQL_USERNAME') ?: 'aad_mysql_medapp';
$pass = getenv('AZURE_MYSQL_PASSWORD') ?: 'QuinnRocks!';
$db   = getenv('AZURE_MYSQL_DBNAME') ?: 'med-app-db';
$port = (int)(getenv('AZURE_MYSQL_PORT') ?: '3306');

// Test environment variables
if (!$host || !$user || !$db) {
    http_response_code(500);
    echo json_encode(['error' => 'Missing environment variables']);
    exit;
}

// Initialize mysqli
$mysqli = mysqli_init();
if (!$mysqli) {
    http_response_code(500);
    echo json_encode(['error' => 'mysqli_init failed']);
    exit;
}

// Set SSL options BEFORE connecting
$sslCertPath = '/home/site/wwwroot/certs/DigiCertGlobalRootG2.crt';

if (file_exists($sslCertPath)) {
    $mysqli->ssl_set(NULL, NULL, $sslCertPath, NULL, NULL);
    $mysqli->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, 1);
} else {
    $mysqli->ssl_set(NULL, NULL, NULL, NULL, NULL);
    $mysqli->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, 0);
}

// NOW connect (only once!)
if (!@$mysqli->real_connect($host, $user, $pass, $db, $port, NULL, MYSQLI_CLIENT_SSL)) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $mysqli->connect_error]);
    exit;
}

$mysqli->set_charset('utf8mb4');

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['email']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password required']);
    exit;
}

$email = $input['email'];
$password = $input['password'];

// Query user - get failed_login_count too
$sql = "SELECT user_id, username, email, password_hash, role, failed_login_count, is_active 
        FROM user_account 
        WHERE email = ? 
        LIMIT 1";
$stmt = $mysqli->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to prepare statement: ' . $mysqli->error]);
    exit;
}

$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();

if (!$result || $result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
    $stmt->close();
    $mysqli->close();
    exit;
}

$user = $result->fetch_assoc();
$stmt->close();

// Check if account is locked (password_hash is null means locked)
if ($user['password_hash'] === null) {
    http_response_code(403);
    echo json_encode([
        'error' => 'Account locked due to too many failed login attempts. Please reset your password.'
    ]);
    $mysqli->close();
    exit;
}

// Check if account is active
if ($user['is_active'] == 0) {
    http_response_code(403);
    echo json_encode([
        'error' => 'Account is inactive. Please contact an administrator.'
    ]);
    $mysqli->close();
    exit;
}

// Verify password
if (!password_verify($password, $user['password_hash'])) {
    // Password is incorrect - increment failed_login_count
    $failedCount = intval($user['failed_login_count']) + 1;
    
    // Lock account after 5 failed attempts
    if ($failedCount >= 5) {
        $updateStmt = $mysqli->prepare(
            "UPDATE user_account 
             SET failed_login_count = ?, 
                 password_hash = NULL, 
                 updated_at = NOW() 
             WHERE user_id = ?"
        );
        $updateStmt->bind_param('ii', $failedCount, $user['user_id']);
        $updateStmt->execute();
        $updateStmt->close();
        
        http_response_code(403);
        echo json_encode([
            'error' => 'Account locked due to too many failed login attempts. Please reset your password.'
        ]);
    } else {
        // Just increment the counter
        $updateStmt = $mysqli->prepare(
            "UPDATE user_account 
             SET failed_login_count = ?, 
                 updated_at = NOW() 
             WHERE user_id = ?"
        );
        $updateStmt->bind_param('ii', $failedCount, $user['user_id']);
        $updateStmt->execute();
        $updateStmt->close();
        
        http_response_code(401);
        echo json_encode([
            'error' => 'Invalid credentials',
            'attemptsRemaining' => 5 - $failedCount
        ]);
    }
    
    $mysqli->close();
    exit;
}

// Password is correct - reset failed_login_count
if ($user['failed_login_count'] > 0) {
    $resetStmt = $mysqli->prepare(
        "UPDATE user_account 
         SET failed_login_count = 0, 
             updated_at = NOW() 
         WHERE user_id = ?"
    );
    $resetStmt->bind_param('i', $user['user_id']);
    $resetStmt->execute();
    $resetStmt->close();
}

// Set session
$_SESSION['uid'] = $user['user_id'];
$_SESSION['email'] = $user['email'];
$_SESSION['role'] = $user['role'];
$_SESSION['username'] = $user['username'];

$mysqli->close();

// Return success
http_response_code(200);
echo json_encode([
    'success' => true,
    'user' => [
        'user_id' => $user['user_id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role']
    ]
]);
?>