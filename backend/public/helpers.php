<?php
// helpers.php - Helper functions for patient_api.php

// Enable CORS for frontend
header('Access-Control-Allow-Origin: http://localhost:5173'); // Change to your Vite port
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start session (for when auth is ready)
session_start();

// ==================== TEMPORARY MOCK AUTH ====================
// TODO: Replace this with real auth when teammate finishes
function requireAuth($allowed_roles = ['PATIENT']) {
    // MOCK: For testing, always set a fake patient_id
    if (!isset($_SESSION['patient_id'])) {
        $_SESSION['patient_id'] = 1; // Hardcoded test patient ID
        $_SESSION['role'] = 'PATIENT';
        $_SESSION['username'] = 'johndoe';
    }
    
    // When real auth is ready, uncomment this:
    /*
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['role'])) {
        sendResponse(false, [], 'Authentication required', 401);
    }
    
    if (!in_array($_SESSION['role'], $allowed_roles)) {
        sendResponse(false, [], 'Access denied', 403);
    }
    */
}

// ==================== RESPONSE HELPER ====================
function sendResponse($success, $data = [], $message = '', $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message
    ], JSON_PRETTY_PRINT);
    exit();
}

// ==================== VALIDATION HELPER ====================
function validateRequired($data, $required_fields) {
    $missing = [];
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || (is_string($data[$field]) && empty(trim($data[$field])))) {
            $missing[] = $field;
        }
    }
    return $missing;
}

// ==================== SANITIZATION HELPER ====================
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}
?>