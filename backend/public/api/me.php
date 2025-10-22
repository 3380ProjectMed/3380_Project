<?php
declare(strict_types=1);
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

$mysqli = new mysqli(
  getenv('DB_HOST') ?: 'localhost',
  getenv('DB_USER') ?: 'app',
  getenv('DB_PASSWORD') ?: '',
  getenv('DB_NAME') ?: 'med-app-db',
  (int)(getenv('DB_PORT') ?: 3306)
);
$mysqli->set_charset('utf8mb4');

$stmt = $mysqli->prepare('SELECT user_id, username, email, role FROM user_account WHERE user_id=?');
$stmt->bind_param('i', $_SESSION['uid']);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();

if (!$user) { // stale session
  session_destroy();
  http_response_code(401);
  echo json_encode(['error' => 'Not authenticated']);
  exit;
}

echo json_encode($user);
