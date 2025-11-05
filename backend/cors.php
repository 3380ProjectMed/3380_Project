<?php
$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://medconnect.azurewebsites.net',
    'https://medconnect-h8gyeya7hbdffxaq.westus3-01.azurewebsites.net',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Only send CORS headers if there's an Origin header (cross-origin request)
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
    
    $allowHeaders = 'Content-Type, Authorization, X-Requested-With';
    $allowMethods = 'GET, POST, PUT, DELETE, OPTIONS';
    
    header("Access-Control-Allow-Methods: {$allowMethods}");
    header("Access-Control-Allow-Headers: {$allowHeaders}");
    
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        header('Access-Control-Max-Age: 600');
        http_response_code(204);
        exit;
    }
}

// Session configuration
if (session_status() === PHP_SESSION_NONE) {
    // For same-origin requests (production on same domain)
    ini_set('session.cookie_samesite', 'Lax');  // Changed from 'None'!
    ini_set('session.cookie_secure', '1');       // HTTPS
    ini_set('session.cookie_httponly', '1');     // Security
    ini_set('session.gc_maxlifetime', 3600);     // 1 hour
    
    // Optional: Set explicit cookie path
    ini_set('session.cookie_path', '/');
}

