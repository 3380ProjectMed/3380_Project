<?php
//login.php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../../error.log');

require_once __DIR__ . '/../cors.php';
// Use the centralized session.php instead of calling session_start() directly
require_once __DIR__ . '/../session.php';

header('Content-Type: application/json');

$host = getenv('AZURE_MYSQL_HOST') ?: 'medconnect-db.mysql.database.azure.com';
$user = getenv('AZURE_MYSQL_USERNAME') ?: 'aad_mysql_medapp';
$pass = getenv('AZURE_MYSQL_PASSWORD') ?: 'QuinnRocks!';
$db   = getenv('AZURE_MYSQL_DBNAME') ?: 'med-app-db';
$port = (int)(getenv('AZURE_MYSQL_PORT') ?: '3306');

if (!$host || !$user || !$db) {
    http_response_code(500);
    echo json_encode(['error' => 'Missing environment variables']);
    exit;
}

$mysqli = mysqli_init();
if (!$mysqli) {
    http_response_code(500);
    echo json_encode(['error' => 'mysqli_init failed']);
    exit;
}

$sslCertPath = '/home/site/wwwroot/certs/DigiCertGlobalRootG2.crt';

if (file_exists($sslCertPath)) {
    $mysqli->ssl_set(NULL, NULL, $sslCertPath, NULL, NULL);
    $mysqli->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, 1);
} else {
    $mysqli->ssl_set(NULL, NULL, NULL, NULL, NULL);
    $mysqli->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, 0);
}

if (!@$mysqli->real_connect($host, $user, $pass, $db, $port, NULL, MYSQLI_CLIENT_SSL)) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $mysqli->connect_error]);
    exit;
}

$mysqli->set_charset('utf8mb4');

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['email']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password required']);
    exit;
}

$email = $input['email'];
$password = $input['password'];

// Query user with name from appropriate table based on role
$sql = "SELECT 
            ua.user_id, 
            ua.username, 
            ua.email, 
            ua.password_hash, 
            ua.role, 
            ua.failed_login_count, 
            ua.is_active,
            CASE 
                WHEN ua.role = 'PATIENT' THEN p.first_name
                ELSE s.first_name
            END as first_name,
            CASE 
                WHEN ua.role = 'PATIENT' THEN p.last_name
                ELSE s.last_name
            END as last_name
        FROM user_account ua
        LEFT JOIN staff s ON ua.user_id = s.staff_id AND ua.role IN ('DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN')
        LEFT JOIN patient p ON ua.user_id = p.patient_id AND ua.role = 'PATIENT'
        WHERE ua.email = ? 
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

// Check if account is locked
if ($user['password_hash'] === null) {
    http_response_code(403);
    echo json_encode([
        'error' => 'Please reset your password to continue.'
    ]);
    $mysqli->close();
    exit;
}

// Check if account is active
if ($user['is_active'] == 0) {
    http_response_code(403);
    echo json_encode([
        'error' => 'Unable to sign in. Please contact support.'
    ]);
    $mysqli->close();
    exit;
}

// Verify password
if (!password_verify($password, $user['password_hash'])) {
    $failedCount = intval($user['failed_login_count']) + 1;

    if ($failedCount > 3) {
        $updateStmt = $mysqli->prepare(
            "UPDATE user_account 
            SET failed_login_count = ?, 
                updated_at = NOW() 
            WHERE user_id = ?"
        );
        $updateStmt->bind_param('ii', $failedCount, $user['user_id']);
        $updateStmt->execute();
        $updateStmt->close();

        http_response_code(403);
        echo json_encode([
            'error' => 'Please reset your password to continue.',
            'requiresReset' => true
        ]);
    } else {
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

// Password correct - reset failed_login_count and update last_login_at
$updateStmt = $mysqli->prepare(
    "UPDATE user_account 
     SET failed_login_count = 0,
         last_login_at = NOW(),
         updated_at = NOW() 
     WHERE user_id = ?"
);
$updateStmt->bind_param('i', $user['user_id']);
$updateStmt->execute();
$updateStmt->close();

// Set session
$_SESSION['uid'] = $user['user_id'];
$_SESSION['email'] = $user['email'];
$_SESSION['role'] = $user['role'];
$_SESSION['username'] = $user['username'];
$_SESSION['first_name'] = $user['first_name'];
$_SESSION['last_name'] = $user['last_name'];

$mysqli->close();

http_response_code(200);
echo json_encode([
    'success' => true,
    'user' => [
        'user_id' => $user['user_id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name']
    ]
]);
