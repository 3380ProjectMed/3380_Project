<?php
// Flexible CORS helper that allows dev servers on localhost using different ports
// If a request comes from a localhost origin (including 127.0.0.1) we echo that
// origin back in Access-Control-Allow-Origin so browsers will accept cookies.

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowOrigin = 'http://localhost:5173'; // default fallback

// Allow any localhost origin (http) or 127.0.0.1. Adjust as needed for your dev ports.
if ($origin) {
    if (preg_match('#^https?://localhost(?::[0-9]+)?$#', $origin) || preg_match('#^https?://127\\.0\\.0\\.1(?::[0-9]+)?$#', $origin)) {
        $allowOrigin = $origin;
    }
}

header("Access-Control-Allow-Origin: $allowOrigin");
header("Access-Control-Allow-Credentials: true"); // must be true for cookies
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Preflight request — reply with allowed headers/methods and exit
    http_response_code(200);
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    exit(0);
}
?>