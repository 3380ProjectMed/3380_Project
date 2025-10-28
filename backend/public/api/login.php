<?php
// public/api/login.php
declare(strict_types=1);

// Ensure CORS headers are sent for requests coming from the dev server
require_once __DIR__ . '/../cors.php';

session_start();
header('Content-Type: application/json');

$host = getenv('AZURE_MYSQL_HOST') ?: '';
$user = getenv('AZURE_MYSQL_USERNAME') ?: '';
$pass = getenv('AZURE_MYSQL_PASSWORD') ?: '';
$db   = getenv('AZURE_MYSQL_DBNAME') ?: '';
$port = (int)(getenv('AZURE_MYSQL_PORT') ?: '3306');

// Initialize mysqli with SSL for Azure MySQL
$mysqli = mysqli_init();
if (!$mysqli) {
    http_response_code(500);
    echo json_encode(['error' => 'mysqli_init failed']);
    exit;
}

// Set SSL options for Azure MySQL
$mysqli->ssl_set(null, null, null, null, null);
$mysqli->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, false);

// Connect with SSL
if (!@$mysqli->real_connect($host, $user, $pass, $db, $port, null, MYSQLI_CLIENT_SSL)) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $mysqli->connect_error]);
    exit;
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['email']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password required']);
    exit;
}

$email = $mysqli->real_escape_string($input['email']);
$password = $input['password'];

// Query user
$sql = "SELECT id, email, password, role FROM user_account WHERE email = '$email' LIMIT 1";
$result = $mysqli->query($sql);

if (!$result || $result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
    exit;
}

$user = $result->fetch_assoc();

// Verify password
if (!password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
    exit;
}

// Set session
$_SESSION['user_id'] = $user['id'];
$_SESSION['email'] = $user['email'];
$_SESSION['role'] = $user['role'];

// Return success
http_response_code(200);
echo json_encode([
    'success' => true,
    'user' => [
        'id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role']
    ]
]);

$mysqli->close();
