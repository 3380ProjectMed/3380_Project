<?php
// public/api/login.php
declare(strict_types=1);

// Ensure CORS headers are sent for requests coming from the dev server
require_once __DIR__ . '/../cors.php';

session_start();
// Content-Type header is set by cors.php, but keep it here for clarity
header('Content-Type: application/json');

  $host = getenv('AZURE_MYSQL_HOST') ?: '';
  $user = getenv('AZURE_MYSQL_USERNAME') ?: '';
  $pass = getenv('AZURE_MYSQL_PASSWORD') ?: '';
  $db   = getenv('AZURE_MYSQL_DBNAME') ?: '';
  $port = getenv('AZURE_MYSQL_PORT') ?: '3306';

$mysqli = @new mysqli($host, $user, $pass, $name, $port);
if ($mysqli->connect_errno) {
  http_response_code(500);
  echo json_encode(['error' => 'DB connection failed']);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

$input    = json_decode(file_get_contents('php://input'), true) ?? [];
$email    = trim((string)($input['email'] ?? ''));
$password = (string)($input['password'] ?? '');

if ($email === '' || $password === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Email and password are required']);
  exit;
}

$sql = 'SELECT user_id, username, email, password_hash, role, is_active
        FROM user_account WHERE email = ? LIMIT 1';

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
  http_response_code(500);
  echo json_encode(['error' => 'Prepare failed']);
  exit;
}

$stmt->bind_param('s', $email);
$stmt->execute();

$res = $stmt->get_result(); // requires mysqlnd
$row = $res ? $res->fetch_assoc() : null;

$stmt->close();
$mysqli->close();

if (!$row || !(int)$row['is_active']) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid credentials']);
  exit;
}

$stored = (string)$row['password_hash'];

// Accept bcrypt or plaintext (DEV ONLY).
$isBcrypt = str_starts_with($stored, '$2y$') || str_starts_with($stored, '$2a$') || str_starts_with($stored, '$2b$');
$ok = $isBcrypt ? password_verify($password, $stored) : hash_equals($stored, $password);

if (!$ok) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid credentials']);
  exit;
}

$_SESSION['uid']      = (int)$row['user_id'];
$_SESSION['role']     = $row['role'];
$_SESSION['username'] = $row['username'];

echo json_encode([
  'user_id'  => (int)$row['user_id'],
  'username' => $row['username'],
  'email'    => $row['email'],
  'role'     => $row['role'],
]);
