<?php
declare(strict_types=1);
// Ensure CORS headers are present for cross-origin logout requests
require_once '/home/site/wwwroot/cors.php';
session_start();
$_SESSION = [];
if (ini_get('session.use_cookies')) {
  $p = session_get_cookie_params();
  setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
}
session_destroy();
header('Content-Type: application/json');
echo json_encode(['ok' => true]);
