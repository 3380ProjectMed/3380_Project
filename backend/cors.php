<?php
/**
 * Minimal CORS helper for PHP APIs.
 * - Whitelists allowed origins (dev + prod).
 * - Supports credentials.
 * - Handles OPTIONS preflight.
 */

$allowedOrigins = [
    'http://localhost:5173',                                              // Vite dev
    'https://medconnect.azurewebsites.net',                              // App Service
    'https://medconnect-h8gveya7hbdffxaq.westus3-01.azurewebsites.net', // Azure full domain
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
}

// Reflect headers the browser asked for
$reqHeaders = $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ?? 'Content-Type, Authorization, X-Requested-With';
$allowMethods = 'GET, POST, PUT, DELETE, OPTIONS';

// Preflight
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    header("Access-Control-Allow-Methods: {$allowMethods}");
    header("Access-Control-Allow-Headers: {$reqHeaders}");
    header('Access-Control-Max-Age: 600');
    http_response_code(204);
    exit;
}
