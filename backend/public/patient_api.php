<?php
// patient_api.php - Simplified version for Azure deployment

require_once 'helpers.php';

header('Content-Type: application/json');

// Database connection using Azure environment variables
$host = getenv('AZURE_MYSQL_HOST') ?: 'localhost';
$user = getenv('AZURE_MYSQL_USERNAME') ?: 'root';
$pass = getenv('AZURE_MYSQL_PASSWORD') ?: '';
$name = getenv('AZURE_MYSQL_DBNAME') ?: 'med-app-db';
$port = (int)(getenv('AZURE_MYSQL_PORT') ?: 3306);

try {
    $mysqli = new mysqli($host, $user, $pass, $name, $port);
    
    if ($mysqli->connect_error) {
        sendResponse(false, [], 'Database connection failed: ' . $mysqli->connect_error, 500);
    }
} catch (Exception $e) {
    sendResponse(false, [], 'Database connection error: ' . $e->getMessage(), 500);
}

// Require authentication
requireAuth(['PATIENT']);

// Get patient_id from session
$patient_id = $_SESSION['patient_id'] ?? null;

// If patient_id isn't set, try to get it from the authenticated user's email
if (!$patient_id) {
    $user_email = $_SESSION['email'] ?? null;
    if ($user_email) {
        try {
            // Try lowercase first, then mixed case as fallback
            $stmt = $mysqli->prepare("SELECT patient_id FROM patient WHERE email = ? LIMIT 1");
            if (!$stmt) {
                // Fallback to mixed case
                $stmt = $mysqli->prepare("SELECT Patient_ID as patient_id FROM Patient WHERE Email = ? LIMIT 1");
            }
            
            if ($stmt) {
                $stmt->bind_param('s', $user_email);
                $stmt->execute();
                $res = $stmt->get_result();
                $row = $res ? $res->fetch_assoc() : null;
                if ($row && isset($row['patient_id'])) {
                    $patient_id = (int)$row['patient_id'];
                    $_SESSION['patient_id'] = $patient_id;
                }
                $stmt->close();
            }
        } catch (Exception $e) {
            error_log('Patient lookup error: ' . $e->getMessage());
        }
    }
}

if (!$patient_id) {
    sendResponse(false, [], 'Patient ID not found for authenticated user', 400);
}

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = $_GET['endpoint'] ?? '';

// ==================== DASHBOARD ====================
if ($endpoint === 'dashboard') {
    if ($method === 'GET') {
        try {
            // Simple response for now - we'll build this up
            sendResponse(true, [
                'patient_id' => $patient_id,
                'upcoming_appointments' => [],
                'pcp' => null,
                'recent_activity' => []
            ]);
        } catch (Exception $e) {
            error_log("Dashboard error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to load dashboard', 500);
        }
    }
}

// ==================== DOCTORS ====================
elseif ($endpoint === 'doctors') {
    if ($method === 'GET') {
        try {
            // Try lowercase schema first, then mixed case fallback
            $query = "SELECT 
                doctor_id,
                CONCAT(first_name, ' ', last_name) as name,
                'General Practice' as specialty_name,
                'Main Office' as office_name,
                'Main Location' as location
                FROM doctor 
                ORDER BY last_name, first_name 
                LIMIT 10";
                
            $result = $mysqli->query($query);
            
            if (!$result) {
                // Fallback to mixed case
                $query = "SELECT 
                    Doctor_id as doctor_id,
                    CONCAT(First_Name, ' ', Last_Name) as name,
                    'General Practice' as specialty_name,
                    'Main Office' as office_name,
                    'Main Location' as location
                    FROM Doctor 
                    ORDER BY Last_Name, First_Name 
                    LIMIT 10";
                $result = $mysqli->query($query);
            }
            
            $doctors = [];
            if ($result) {
                $doctors = $result->fetch_all(MYSQLI_ASSOC);
            }
            
            sendResponse(true, $doctors);
        } catch (Exception $e) {
            error_log("Doctors error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to load doctors', 500);
        }
    }
}

// ==================== PROFILE ====================
elseif ($endpoint === 'profile') {
    if ($method === 'GET') {
        try {
            // Try lowercase first
            $query = "SELECT 
                patient_id,
                first_name,
                last_name,
                email,
                dob
                FROM patient 
                WHERE patient_id = ?";
                
            $stmt = $mysqli->prepare($query);
            
            if (!$stmt) {
                // Fallback to mixed case
                $query = "SELECT 
                    Patient_ID as patient_id,
                    First_Name as first_name,
                    Last_Name as last_name,
                    Email as email,
                    dob
                    FROM Patient 
                    WHERE Patient_ID = ?";
                $stmt = $mysqli->prepare($query);
            }
            
            if ($stmt) {
                $stmt->bind_param('i', $patient_id);
                $stmt->execute();
                $result = $stmt->get_result();
                $profile = $result->fetch_assoc();
                
                if ($profile) {
                    sendResponse(true, $profile);
                } else {
                    sendResponse(false, [], 'Profile not found', 404);
                }
                $stmt->close();
            } else {
                sendResponse(false, [], 'Database query failed', 500);
            }
        } catch (Exception $e) {
            error_log("Profile error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to load profile', 500);
        }
    }
}

// ==================== APPOINTMENTS ====================
elseif ($endpoint === 'appointments') {
    if ($method === 'GET') {
        try {
            // Simple appointments response
            sendResponse(true, []);
        } catch (Exception $e) {
            error_log("Appointments error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to load appointments', 500);
        }
    }
}

// Invalid endpoint
else {
    sendResponse(false, [], 'Invalid endpoint: ' . $endpoint, 404);
}

$mysqli->close();
?>