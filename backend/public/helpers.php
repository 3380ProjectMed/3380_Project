<?php
// helpers.php - Helper functions for patient_api.php

// Enable CORS for frontend
// Allow the dev server origin dynamically (supports different localhost ports like 5173/5174)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && (str_starts_with($origin, 'http://localhost') || str_starts_with($origin, 'http://127.0.0.1'))) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Fallback for non-local development; adjust for production
    header('Access-Control-Allow-Origin: http://localhost:5173');
}
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

function requireAuth($allowed_roles = ['PATIENT']) {
    // MOCK: For testing, dynamically find and use any valid patient
    if (!isset($_SESSION['patient_id'])) {
        // Get a database connection to find a valid patient
        try {
            require_once '../database.php';
            $mysqli = getDBConnection();
            
            // Find the first available patient in the database
            $stmt = $mysqli->prepare("SELECT patient_id, first_name, last_name, email FROM patient LIMIT 1");
            $stmt->execute();
            $result = $stmt->get_result();
            $patient = $result->fetch_assoc();
            $stmt->close();
            
            if ($patient) {
                $_SESSION['patient_id'] = $patient['patient_id'];
                $_SESSION['role'] = 'PATIENT';
                $_SESSION['username'] = strtolower($patient['first_name'] . $patient['last_name']);
                $_SESSION['email'] = $patient['email'];
                error_log("Mock auth: Using patient_id = " . $patient['patient_id'] . " (" . $patient['first_name'] . " " . $patient['last_name'] . ")");
            } else {
                // Fallback if no patients found
                $_SESSION['patient_id'] = 1;
                $_SESSION['role'] = 'PATIENT';
                $_SESSION['username'] = 'testpatient';
                error_log("Mock auth: No patients found in database, using fallback patient_id = 1");
            }
        } catch (Exception $e) {
            // If database connection fails, use fallback
            $_SESSION['patient_id'] = 1;
            $_SESSION['role'] = 'PATIENT';
            $_SESSION['username'] = 'testpatient';
            error_log("Mock auth: Database error, using fallback - " . $e->getMessage());
        }
    }
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