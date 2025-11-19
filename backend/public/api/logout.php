<?php
//logout.php
declare(strict_types=1);
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/session.php';

// Clear session cookie
if (ini_get('session.use_cookies')) {
  $p = session_get_cookie_params();
  setcookie(
    session_name(),
    '',
    time() - 42000,
    $p['path'],
    $p['domain'],
    $p['secure'],
    $p['httponly']
  );
}

// Clear session variables from memory
session_unset();

// Destroy session (triggers database deletion)
session_destroy();

header('Content-Type: application/json');
echo json_encode(['ok' => true]);
