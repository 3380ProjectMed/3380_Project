<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true"); // ⭐ Must be true
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

/**
 * Minimal CORS helper for PHP APIs.
 * - Whitelists allowed origins (dev + prod).
 * - Supports credentials.
 * - Handles OPTIONS preflight.
 */

$allowedOrigins = [
    'http://localhost:5173',                     // Vite dev
    'https://medconnect.azurewebsites.net',      // App Service
    // 'https://your-custom-domain.tld',         // add if/when you map a custom domain
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Vary: Origin'); // caching correctness when multiple origins
    header('Access-Control-Allow-Credentials: true'); // if you use cookies/sessions
}

// Reflect headers the browser asked for, but keep a safe default
$reqHeaders = $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ?? 'Content-Type, Authorization';

// Methods you actually support; keep this tight if possible
$allowMethods = 'GET, POST, PUT, DELETE, OPTIONS';

// Preflight
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    header("Access-Control-Allow-Methods: {$allowMethods}");
    header("Access-Control-Allow-Headers: {$reqHeaders}");
    header('Access-Control-Max-Age: 600'); // cache preflight for 10 minutes
    http_response_code(204);
    exit;
}

// For JSON APIs, let the endpoint set Content-Type. If you want a default:
// header('Content-Type: application/json; charset=utf-8');
