<?php
declare(strict_types=1);
// Suppress HTML-formatted errors early to avoid leaking into JSON responses
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
ini_set('html_errors', '0');
// Avoid deprecated constants (E_STRICT removed in newer PHP versions)
error_reporting(E_ALL & ~E_DEPRECATED);

// Start output buffering so we can control any accidental output and
// ensure responses are valid JSON. Also register a shutdown handler
// to catch fatal errors and return them as JSON instead of HTML.
ob_start();
register_shutdown_function(function () {
  $err = error_get_last();
  if ($err !== null) {
    // Clean any buffered output and return a JSON error payload
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

session_start([
  'cookie_httponly' => true,
  'cookie_secure'   => !empty($_SERVER['HTTPS']),
  'cookie_samesite' => 'Lax',
]);
header('Content-Type: application/json');

if (empty($_SESSION['uid'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Not authenticated']);
  exit;
}

// Connect to the database and return JSON on failure
$mysqli = new mysqli(
  getenv('DB_HOST') ?: 'localhost',
  getenv('DB_USER') ?: 'app',
  getenv('DB_PASSWORD') ?: '',
  getenv('DB_NAME') ?: 'med-app-db',
  (int)(getenv('DB_PORT') ?: 3306)
);
if ($mysqli->connect_errno) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'DB connection failed', 'detail' => $mysqli->connect_error]);
    exit;
}
$mysqli->set_charset('utf8mb4');

// Try to fetch the user and (if doctor) associated Doctor_id
// Prepare statement and handle prepare errors gracefully
$sql = 'SELECT ua.user_id, ua.username, ua.email, ua.role, d.Doctor_id AS doctor_id
  FROM user_account ua
  LEFT JOIN Doctor d ON ua.email = d.Email
  WHERE ua.user_id = ?';

$stmt = $mysqli->prepare($sql);
if ($stmt === false) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'Failed to prepare statement', 'detail' => $mysqli->error]);
  $mysqli->close();
  exit;
}

$stmt->bind_param('i', $_SESSION['uid']);
if (!$stmt->execute()) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'Failed to execute query', 'detail' => $stmt->error]);
  $stmt->close();
  $mysqli->close();
  exit;
}

// Attempt to get results via get_result(); if it's not available (e.g. no mysqlnd),
// fall back to bind_result() to build the row manually.
$user = null;
if (method_exists($stmt, 'get_result')) {
  $res = $stmt->get_result();
  if ($res === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to fetch query results', 'detail' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
  }
  $user = $res->fetch_assoc();
} else {
  // bind_result fallback: explicit column bindings
  $bound = $stmt->bind_result($user_id, $username, $email, $role, $doctor_id);
  if ($bound === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to bind results', 'detail' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
  }

  $fetched = $stmt->fetch();
  if ($fetched === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to fetch bound results', 'detail' => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
  }

  // If no row was returned, treat as unauthenticated/stale session
  if ($fetched === null || $user_id === null) {
    session_destroy();
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    $stmt->close();
    $mysqli->close();
    exit;
  }

  $user = [
    'user_id' => is_numeric($user_id) ? (int)$user_id : $user_id,
    'username' => $username,
    'email' => $email,
    'role' => $role,
    'doctor_id' => $doctor_id === null ? null : (is_numeric($doctor_id) ? (int)$doctor_id : $doctor_id),
  ];
}

if (!$user) { // stale session or user not found
  session_destroy();
  http_response_code(401);
  echo json_encode(['success' => false, 'error' => 'Not authenticated']);
  $stmt->close();
  $mysqli->close();
  exit;
}

// Return raw user object for backward compatibility with frontend
echo json_encode($user);

$stmt->close();
$mysqli->close();
exit;
