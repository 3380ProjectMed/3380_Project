<?php
// public/api/login.php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../../error.log');

// Ensure CORS headers are sent for requests coming from the dev server
require_once __DIR__ . '/../cors.php';

session_start([
  'cookie_httponly' => true,
  'cookie_secure'   => !empty($_SERVER['HTTPS']),
  'cookie_samesite' => 'Lax',
]);

header('Content-Type: application/json');

$host = getenv('AZURE_MYSQL_HOST') ?: '';
$user = getenv('AZURE_MYSQL_USERNAME') ?: '';
$pass = getenv('AZURE_MYSQL_PASSWORD') ?: '';
$db   = getenv('AZURE_MYSQL_DBNAME') ?: '';
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
// Use absolute path for Azure App Service
$sslCertPath = '/home/site/wwwroot/certs/DigiCertGlobalRootG2.crt';

if (file_exists($sslCertPath)) {
    // Use certificate verification (more secure)
    $mysqli->ssl_set(NULL, NULL, $sslCertPath, NULL, NULL);
    $mysqli->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, true);
} else {
    // Fallback: Don't verify (less secure, but works if cert is missing)
    $mysqli->ssl_set(NULL, NULL, NULL, NULL, NULL);
    $mysqli->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, false);
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

$email = $mysqli->real_escape_string($input['email']);
$password = $input['password'];

// Query user - using your actual table name 'user_account'
$sql = "SELECT user_id, username, email, password_hash, role FROM user_account WHERE email = ? LIMIT 1";
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

// Verify password - FIXED: use password_hash instead of password
if (!password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
    $mysqli->close();
    exit;
}

// Set session - using 'uid' to match me.php
$_SESSION['uid'] = $user['user_id'];
$_SESSION['email'] = $user['email'];
$_SESSION['role'] = $user['role'];
$_SESSION['username'] = $user['username'];

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

$mysqli->close();