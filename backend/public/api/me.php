<?php
declare(strict_types=1);

// Log to a file we can check
$logFile = '/home/site/wwwroot/me_debug.log';
function debug_log($message)
{
  global $logFile;
  file_put_contents($logFile, date('Y-m-d H:i:s') . ' - ' . $message . PHP_EOL, FILE_APPEND);
}

debug_log('=== ME.PHP START ===');

// Ensure CORS headers
if (file_exists(__DIR__ . '/../cors.php')) {
  require_once __DIR__ . '/../cors.php';
} else {
  require_once '/home/site/wwwroot/cors.php';
}
debug_log('CORS loaded');

ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
ini_set('html_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED);

ob_start();
register_shutdown_function(function () {
  global $logFile;
  $err = error_get_last();
  if ($err !== null) {
    debug_log('FATAL ERROR: ' . json_encode($err));
    if (ob_get_length()) {
      @ob_clean();
    }
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
      'success' => false,
      'error' => 'Fatal error',
      'message' => $err['message'],
      'file' => $err['file'],
      'line' => $err['line'],
    ]);
  }
});

debug_log('Starting session');
session_start([
  'cookie_httponly' => true,
  'cookie_secure' => !empty($_SERVER['HTTPS']),
  'cookie_samesite' => 'Lax',
]);
header('Content-Type: application/json');

debug_log('Session UID: ' . ($_SESSION['uid'] ?? 'NOT SET'));

if (empty($_SESSION['uid'])) {
  debug_log('No UID in session - returning 401');
  http_response_code(401);
  echo json_encode(['error' => 'Not authenticated']);
  exit;
}

debug_log('Initializing mysqli');

$mysqli = mysqli_init();
if (!$mysqli) {
  debug_log('mysqli_init failed');
  http_response_code(500);
  echo json_encode(['error' => 'mysqli_init failed']);
  exit;
}

$sslCertPath = '/home/site/wwwroot/certs/DigiCertGlobalRootG2.crt';
debug_log('SSL cert exists: ' . (file_exists($sslCertPath) ? 'YES' : 'NO'));

if (file_exists($sslCertPath)) {
  $mysqli->ssl_set(NULL, NULL, $sslCertPath, NULL, NULL);
  $mysqli->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, 1);
} else {
  $mysqli->ssl_set(NULL, NULL, NULL, NULL, NULL);
  $mysqli->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, 0);
}

$host = getenv('AZURE_MYSQL_HOST') ?: '';
$user = getenv('AZURE_MYSQL_USERNAME') ?: '';
$pass = getenv('AZURE_MYSQL_PASSWORD') ?: '';
$db = getenv('AZURE_MYSQL_DBNAME') ?: '';
$port = (int) (getenv('AZURE_MYSQL_PORT') ?: '3306');

debug_log("Connecting to: $host:$port as $user to db $db");

if (!@$mysqli->real_connect($host, $user, $pass, $db, $port, NULL, MYSQLI_CLIENT_SSL)) {
  debug_log('Connection failed: ' . $mysqli->connect_error);
  http_response_code(500);
  echo json_encode(['error' => 'Database connection failed: ' . $mysqli->connect_error]);
  exit;
}

debug_log('Connected successfully');
$mysqli->set_charset('utf8mb4');

// Simplified query - just get basic user info with names from appropriate table
$sql = "SELECT 
            ua.user_id, 
            ua.username, 
            ua.email, 
            ua.role,
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
  LEFT JOIN office o ON s.work_location = o.office_id
  LEFT JOIN patient p ON ua.user_id = p.patient_id AND ua.role = 'PATIENT'
        WHERE ua.user_id = ?";

debug_log('Preparing statement');
$stmt = $mysqli->prepare($sql);
if ($stmt === false) {
  debug_log('Prepare failed: ' . $mysqli->error);
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'Failed to prepare statement', 'detail' => $mysqli->error]);
  $mysqli->close();
  exit;
}

debug_log('Binding and executing');
$stmt->bind_param('i', $_SESSION['uid']);
if (!$stmt->execute()) {
  debug_log('Execute failed: ' . $stmt->error);
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'Failed to execute query', 'detail' => $stmt->error]);
  $stmt->close();
  $mysqli->close();
  exit;
}

debug_log('Fetching results');
$user = null;

if (method_exists($stmt, 'get_result')) {
  $res = $stmt->get_result();
  if ($res === false) {
    debug_log('get_result failed: ' . $stmt->error);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to fetch query results', 'detail' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
  }
  $user = $res->fetch_assoc();
  debug_log('User fetched: ' . ($user ? json_encode($user) : 'NULL'));
} else {
  debug_log('Using bind_result fallback');

  $bound = $stmt->bind_result(
    $user_id,
    $username,
    $email,
    $role,
    $first_name,
    $last_name,
    $work_location,
    $office_name
  );

  if ($bound === false) {
    debug_log('bind_result failed: ' . $stmt->error);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to bind results', 'detail' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
  }

  $fetched = $stmt->fetch();
  if ($fetched === false) {
    debug_log('fetch failed: ' . $stmt->error);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to fetch bound results', 'detail' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
  }

  if ($fetched === null || $user_id === null) {
    debug_log('No user found for uid: ' . $_SESSION['uid']);
    session_destroy();
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    $stmt->close();
    $mysqli->close();
    exit;
  }

  $user = [
    'user_id' => is_numeric($user_id) ? (int) $user_id : $user_id,
    'username' => $username,
    'email' => $email,
    'role' => $role,
    'first_name' => $first_name,
    'last_name' => $last_name,
    'work_location' => $work_location,
    'office_name' => $office_name
  ];
  debug_log('User built from bind_result: ' . json_encode($user));
}

if (!$user) {
  debug_log('User is null after fetch');
  session_destroy();
  http_response_code(401);
  echo json_encode(['success' => false, 'error' => 'Not authenticated']);
  $stmt->close();
  $mysqli->close();
  exit;
}

// Return essential user info only
$response = [
  'user_id' => $user['user_id'],
  'username' => $user['username'],
  'email' => $user['email'],
  'role' => $user['role'],
  'first_name' => $user['first_name'],
  'last_name' => $user['last_name'],
  'work_location' => $user['work_location'] ?? null,
  'office_name' => $user['office_name'] ?? null
];

debug_log('Returning user successfully');
echo json_encode($response);

$stmt->close();
$mysqli->close();
debug_log('=== ME.PHP END SUCCESS ===');
exit;