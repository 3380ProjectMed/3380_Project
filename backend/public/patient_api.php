
<?php
// patient_api.php - Patient Portal API Endpoints (cleaned and fixed)

// IMMEDIATE DEBUG - Check if this file is even being called
error_log("=== PATIENT API ENTRY POINT ===");
error_log("Request method: " . ($_SERVER['REQUEST_METHOD'] ?? 'NOT SET'));
error_log("Request URI: " . ($_SERVER['REQUEST_URI'] ?? 'NOT SET'));
error_log("Query string: " . ($_SERVER['QUERY_STRING'] ?? 'NOT SET'));
error_log("================================");

// ALSO DEBUG DIRECTLY TO RESPONSE for immediate visibility
$debug_info = [
    'debug_entry' => 'patient_api.php called',
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'NOT SET',
    'uri' => $_SERVER['REQUEST_URI'] ?? 'NOT SET',
    'query' => $_SERVER['QUERY_STRING'] ?? 'NOT SET'
];

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
// require_once 'helpers.php'; 

header('Content-Type: application/json');

// Azure App Service HTTPS detection
// Azure terminates SSL at the load balancer, so check for proxy headers
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
    || (!empty($_SERVER['HTTP_X_ARR_SSL'])) // Azure-specific header
    || $_SERVER['SERVER_PORT'] == 443;

// Start session with same configuration as login system
session_start([
    'cookie_httponly' => true,
    'cookie_secure'   => $isHttps,  // ← Use proper HTTPS detection
    'cookie_samesite' => 'Lax',
]);

// Helper functions
function requireAuth($allowed_roles = ['PATIENT']) {
    // Enhanced session debugging
    error_log("=== PATIENT API AUTH DEBUG ===");
    error_log("Original Session ID: " . session_id());  
    error_log("Expected Session ID from Cookie: " . ($_COOKIE[session_name()] ?? 'NOT SET'));
    error_log("Session name: " . session_name());
    error_log("Session save path: " . session_save_path());
    error_log("Session data: " . json_encode($_SESSION));
    error_log("All cookies: " . json_encode($_COOKIE));
    error_log("HTTP_COOKIE header: " . ($_SERVER['HTTP_COOKIE'] ?? 'NOT SET'));
    error_log("HTTPS detection: " . ($isHttps ? 'TRUE' : 'FALSE'));
    error_log("================================");
    
    // If session ID doesn't match the cookie, try to restore it
    $expected_session_id = $_COOKIE[session_name()] ?? null;
    if ($expected_session_id && session_id() !== $expected_session_id) {
        error_log("PATIENT AUTH: Session ID mismatch, attempting to restore session");
        session_write_close();
        session_id($expected_session_id);
        session_start([
            'cookie_httponly' => true,
            'cookie_secure'   => $isHttps,
            'cookie_samesite' => 'Lax',
        ]);
        error_log("PATIENT AUTH: After restore - Session ID: " . session_id() . ", Data: " . json_encode($_SESSION));
    }
    
    // Try to restart session if it seems invalid but we have session cookie
    if (empty($_SESSION) && !empty($_COOKIE[session_name()])) {
        error_log("PATIENT AUTH: Session appears invalid but cookie exists, attempting to restart session");
        
        // Use the same HTTPS detection as the main session start
        global $isHttps;
        
        session_destroy();
        session_start([
            'cookie_httponly' => true,
            'cookie_secure'   => $isHttps,
            'cookie_samesite' => 'Lax',
        ]);
        error_log("PATIENT AUTH: After restart - Session ID: " . session_id() . ", Data: " . json_encode($_SESSION));
    }
    
    // Check if we have basic authentication from login system
    if (!isset($_SESSION['uid']) || !isset($_SESSION['email'])) {
        error_log("PATIENT AUTH: Missing session data - uid: " . ($_SESSION['uid'] ?? 'NOT SET') . ", email: " . ($_SESSION['email'] ?? 'NOT SET'));
        sendResponse(false, [], 'User not authenticated - please log in again', 401);
        exit();
    }
    
    // Map logged-in user to patient record (only if not already done)
    if (!isset($_SESSION['patient_id'])) {
        $user_email = $_SESSION['email'];
        error_log("PATIENT AUTH: Looking up patient for email: " . $user_email);
        
        try {
            $mysqli = getDBConnection();
            $stmt = $mysqli->prepare("SELECT patient_id, first_name, last_name FROM patient WHERE email = ? LIMIT 1");
            $stmt->bind_param('s', $user_email);
            $stmt->execute();
            $result = $stmt->get_result();
            $patient = $result->fetch_assoc();
            $stmt->close();
            
            if ($patient) {
                $_SESSION['patient_id'] = $patient['patient_id'];
                error_log("PATIENT AUTH: Successfully mapped to patient_id: " . $patient['patient_id']);
            } else {
                error_log("PATIENT AUTH: No patient record found for email: " . $user_email);
                sendResponse(false, [], 'No patient record found for this user', 403);
                exit();
            }
        } catch (Exception $e) {
            error_log("PATIENT AUTH: Database error: " . $e->getMessage());
            sendResponse(false, [], 'Authentication error', 500);
            exit();
        }
    }
    
    error_log("PATIENT AUTH: Success - patient_id: " . $_SESSION['patient_id']);
}

function sendResponse($success, $data = [], $message = '', $statusCode = 200) {
    global $debug_info;
    
    $response = [
        'success' => $success,
        'data' => $data,
        'message' => $message
    ];
    
    // Add debug info for authentication failures
    if (!$success && $statusCode == 401 && isset($debug_info)) {
        $response['debug'] = $debug_info;
        $response['session_debug'] = [
            'session_id' => session_id(),
            'session_data' => $_SESSION,
            'cookies' => $_COOKIE,
            'http_cookie' => $_SERVER['HTTP_COOKIE'] ?? 'NOT SET'
        ];
    }
    
    http_response_code($statusCode);
    echo json_encode($response, JSON_PRETTY_PRINT);
    exit();
}

function validateRequired($input, $required_fields) {
    $missing = [];
    
    if (!is_array($input)) {
        return $required_fields; // All fields are missing if input is not an array
    }
    
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            $missing[] = $field;
        }
    }
    return $missing;
}

// Use SSL-enabled database connection for Azure MySQL
try {
    $mysqli = getDBConnection();
} catch (Exception $e) {
    sendResponse(false, [], 'Database connection error: ' . $e->getMessage(), 500);
}

// Require authentication (currently mocked)
requireAuth(['PATIENT']);

// Get patient_id from session (set by mock auth)
$patient_id = $_SESSION['patient_id'] ?? null;

// If patient_id isn't set in session, try to map from authenticated user's email
if (!$patient_id) {
    $user_email = $_SESSION['email'] ?? null;
    if ($user_email) {
        // Lookup patient by email in Patient table
        $stmt = $mysqli->prepare("SELECT patient_id FROM patient WHERE email = ? LIMIT 1");
        if ($stmt) {
            $stmt->bind_param('s', $user_email);
            $stmt->execute();
            $res = $stmt->get_result();
            $row = $res ? $res->fetch_assoc() : null;
            if ($row && isset($row['patient_id'])) {
                $patient_id = (int)$row['patient_id'];
                // persist to session for future requests
                $_SESSION['patient_id'] = $patient_id;
            }
            $stmt->close();
        }
    }
}

if (!$patient_id) {
    sendResponse(false, [], 'Patient ID not found for authenticated user', 400);
}

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = $_GET['endpoint'] ?? '';

// Simple test endpoint
if ($endpoint === 'test') {
    sendResponse(true, ['message' => 'Patient API is working', 'timestamp' => date('Y-m-d H:i:s')]);
}

// ==================== DASHBOARD ====================
if ($endpoint === 'dashboard') {
    if ($method === 'GET') {
        try {
            
            // Get upcoming appointments
            $stmt = $mysqli->prepare("
                SELECT 
                    a.appointment_id,
                    a.appointment_date,
                    a.reason_for_visit,
                    a.status,
                    CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                    s.specialty_name,
                    o.name as office_name,
                    CONCAT(o.address, ', ', o.city, ', ', o.state, ' ', o.zipcode) as office_address
                FROM appointment a
                LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
                LEFT JOIN specialty s ON d.specialty = s.specialty_id
                LEFT JOIN office o ON a.office_id = o.office_id
                WHERE a.patient_id = ? 
                AND a.appointment_date >= NOW()
                ORDER BY a.appointment_date ASC
            ");
            
            if (!$stmt) {
                sendResponse(false, [], 'Failed to prepare appointments query: ' . $mysqli->error, 500);
                return;
            }
            
            $stmt->bind_param('i', $patient_id);
            if (!$stmt->execute()) {
                sendResponse(false, [], 'Failed to execute appointments query: ' . $stmt->error, 500);
                return;
            }
            
            $result = $stmt->get_result();
            $upcoming_appointments = $result->fetch_all(MYSQLI_ASSOC);
            
            // Get PCP info
            $stmt = $mysqli->prepare("
                SELECT 
                    d.doctor_id,
                    CONCAT(d.first_name, ' ', d.last_name) as name,
                    s.specialty_name,
                    o.name as office_name,
                    d.phone,
                    d.email,
                    CONCAT(o.address, ', ', o.city, ', ', o.state) as location
                FROM patient p
                LEFT JOIN doctor d ON p.primary_doctor = d.doctor_id
                LEFT JOIN specialty s ON d.specialty = s.specialty_id
                LEFT JOIN office o ON d.work_location = o.office_id
                WHERE p.patient_id = ?
            ");
            $stmt->bind_param('i', $patient_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $pcp = $result->fetch_assoc();
            
            // Get recent activity (last 3 visits)
            $stmt = $mysqli->prepare("
                SELECT 
                    v.visit_id,
                    v.date,
                    CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                    v.status,
                    v.total_due
                FROM patient_visit v
                LEFT JOIN doctor d ON v.doctor_id = d.doctor_id
                WHERE v.patient_id = ?
                ORDER BY v.date DESC
                LIMIT 3
            ");
            $stmt->bind_param('i', $patient_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $recent_activity = $result->fetch_all(MYSQLI_ASSOC);
            
            sendResponse(true, [
                'upcoming_appointments' => $upcoming_appointments,
                'pcp' => $pcp,
                'recent_activity' => $recent_activity
            ]);
            
        } catch (Exception $e) {
            sendResponse(false, [], 'Failed to load dashboard', 500);
        }
    }
}

// ==================== PROFILE ====================
elseif ($endpoint === 'profile') {
    if ($method === 'GET') {
        try {
            // Include human-readable labels for demographic codes so frontend can render text
            $stmt = $mysqli->prepare(
                "SELECT
                    p.patient_id,
                    p.first_name,
                    p.last_name,
                    p.dob,
                    p.email,
                    ec.ec_phone as emergency_contact,
                    ec.ec_first_name as emergency_contact_first_name,
                    ec.ec_last_name as emergency_contact_last_name,
                    ec.relationship as emergency_contact_relationship,
                    p.assigned_at_birth_gender,
                    p.gender,
                    p.ethnicity,
                    p.race,
                    p.blood_type,
                    CONCAT(d.first_name, ' ', d.last_name) as pcp_name,
                    d.doctor_id as pcp_id,
                    s.specialty_name as pcp_specialty,
                    o.name as pcp_office,
                    d.phone as pcp_phone,
                    d.email as pcp_email,
                    CONCAT(o.address, ', ', o.city, ', ', o.state) as pcp_location,
                    cg.gender_text as Gender_Text,
                    cag.gender_text as AssignedAtBirth_Gender_Text,
                    ce.ethnicity_text as Ethnicity_Text,
                    cr.race_text as Race_Text
                FROM patient p
                LEFT JOIN emergency_contact ec ON p.emergency_contact_id = ec.emergency_contact_id
                LEFT JOIN doctor d ON p.primary_doctor = d.doctor_id
                LEFT JOIN specialty s ON d.specialty = s.specialty_id
                LEFT JOIN office o ON d.work_location = o.office_id
                LEFT JOIN codes_gender cg ON p.gender = cg.gender_code
                LEFT JOIN codes_assigned_at_birth_gender cag ON p.assigned_at_birth_gender = cag.gender_code
                LEFT JOIN codes_ethnicity ce ON p.ethnicity = ce.ethnicity_code
                LEFT JOIN codes_race cr ON p.race = cr.race_code
                WHERE p.patient_id = ?"
            );
            $stmt->bind_param('i', $patient_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $profile = $result->fetch_assoc();
            
            if (!$profile) {
                sendResponse(false, [], 'Profile not found', 404);
            }
            
            sendResponse(true, $profile);
            
        } catch (Exception $e) {
            error_log("Profile error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to load profile', 500);
        }
    } 
    elseif ($method === 'PUT') {
        $raw_input = file_get_contents('php://input');
        $input = json_decode($raw_input, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendResponse(false, [], 'Invalid JSON data: ' . json_last_error_msg(), 400);
        }
        
        try {
            // Helper: map a human-readable text value to its numeric code in lookup tables.
            // Returns an empty string when no mapping found or input empty so NULLIF('', '') becomes NULL.
            $mapTextToCode = function($table, $idCol, $textCol, $val) use ($mysqli) {
                $val = trim((string)($val ?? ''));
                if ($val === '') return '';
                // If already numeric, just return as stringified int
                if (is_numeric($val)) return (string)intval($val);
                $sql = "SELECT $idCol FROM $table WHERE $textCol = ? LIMIT 1";
                $st = $mysqli->prepare($sql);
                if (!$st) return '';
                $st->bind_param('s', $val);
                $st->execute();
                $res = $st->get_result();
                $row = $res ? $res->fetch_assoc() : null;
                $st->close();
                return $row && isset($row[$idCol]) ? (string)$row[$idCol] : '';
            };
            // Use NULLIF for optional fields only - first_name and last_name are required
            $stmt = $mysqli->prepare(
                "UPDATE patient
                SET first_name = ?,
                    last_name = ?,
                    email = NULLIF(?, ''),
                    dob = NULLIF(?, ''),
                    gender = NULLIF(?, ''),
                    assigned_at_birth_gender = NULLIF(?, ''),
                    ethnicity = NULLIF(?, ''),
                    race = NULLIF(?, ''),
                    primary_doctor = NULLIF(?, '')
                WHERE patient_id = ?"
            );
            if (!$stmt) {
                // Prepare failed — return a helpful message for devs and log the DB error
                sendResponse(false, [], 'Database prepare failed: ' . $mysqli->error, 500);
            }
            // Expecting keys: first_name, last_name, email, dob (YYYY-MM-DD), emergency_contact,
            // emergency_contact_first_name, emergency_contact_last_name, emergency_contact_relationship,
            // gender, genderAtBirth, ethnicity, race, primary_doctor
            $first = $input['first_name'] ?? '';
            $last = $input['last_name'] ?? '';
            $email = $input['email'] ?? '';
            $dob = $input['dob'] ?? '';
            $emergencyContact = $input['emergency_contact'] ?? '';
            $emergencyContactFirstName = $input['emergency_contact_first_name'] ?? '';
            $emergencyContactLastName = $input['emergency_contact_last_name'] ?? '';
            $emergencyContactRelationship = $input['emergency_contact_relationship'] ?? '';
            $gender = $input['gender'] ?? '';
            $genderAtBirth = $input['genderAtBirth'] ?? '';
            $ethnicity = $input['ethnicity'] ?? '';
            $race = $input['race'] ?? '';

            // Map textual demographic selections to numeric codes expected by the DB
            // Tables and columns as defined in medapp.sql
            $gender = $mapTextToCode('codes_gender', 'gender_code', 'gender_text', $gender);
            $genderAtBirth = $mapTextToCode('codes_assigned_at_birth_gender', 'gender_code', 'gender_text', $genderAtBirth);
            $ethnicity = $mapTextToCode('codes_ethnicity', 'ethnicity_code', 'ethnicity_text', $ethnicity);
            $race = $mapTextToCode('codes_race', 'race_code', 'race_text', $race);
            // primary_doctor is expected to be a doctor id (numeric) or empty string to clear
            $primaryDoctor = isset($input['primary_doctor']) ? trim((string)$input['primary_doctor']) : '';

            // Bind all parameters as strings except the final patient_id (int).
            $stmt->bind_param('sssssssssi', 
                $first,
                $last,
                $email,
                $dob,
                $gender,
                $genderAtBirth,
                $ethnicity,
                $race,
                $primaryDoctor,
                $patient_id
            );
            $exec = $stmt->execute();
            if ($exec === false) {
                // Execution failed — log and return DB error
                sendResponse(false, [], 'Database execute failed: ' . $stmt->error, 500);
            }

            // Handle emergency contact update if any emergency contact field is provided
            if (!empty($emergencyContact) || !empty($emergencyContactFirstName) || !empty($emergencyContactLastName) || !empty($emergencyContactRelationship)) {
                // Check if patient already has an emergency contact
                $checkStmt = $mysqli->prepare("SELECT emergency_contact_id FROM patient WHERE patient_id = ?");
                $checkStmt->bind_param('i', $patient_id);
                $checkStmt->execute();
                $result = $checkStmt->get_result();
                $patientData = $result->fetch_assoc();
                $existingEcId = $patientData['emergency_contact_id'] ?? null;

                if ($existingEcId) {
                    // Update existing emergency contact with all fields
                    $ecStmt = $mysqli->prepare("UPDATE emergency_contact SET ec_first_name = NULLIF(?, ''), ec_last_name = NULLIF(?, ''), ec_phone = NULLIF(?, ''), relationship = NULLIF(?, '') WHERE emergency_contact_id = ?");
                    $ecStmt->bind_param('ssssi', $emergencyContactFirstName, $emergencyContactLastName, $emergencyContact, $emergencyContactRelationship, $existingEcId);
                    $ecStmt->execute();
                } else {
                    // Create new emergency contact record with all fields
                    $ecStmt = $mysqli->prepare("INSERT INTO emergency_contact (patient_id, ec_first_name, ec_last_name, ec_phone, relationship) VALUES (?, NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''))");
                    $ecStmt->bind_param('issss', $patient_id, $emergencyContactFirstName, $emergencyContactLastName, $emergencyContact, $emergencyContactRelationship);
                    $ecStmt->execute();
                    $newEcId = $mysqli->insert_id;
                    
                    // Update patient record with emergency contact ID
                    $updateStmt = $mysqli->prepare("UPDATE patient SET emergency_contact_id = ? WHERE patient_id = ?");
                    $updateStmt->bind_param('ii', $newEcId, $patient_id);
                    $updateStmt->execute();
                }
            }

            sendResponse(true, [], 'Profile updated successfully');
            
        } catch (Exception $e) {
            // Log the full exception and return the message to the client for easier debugging in dev
            error_log("Profile update error: " . $e->getMessage());
            $msg = 'Failed to update profile: ' . $e->getMessage();
            sendResponse(false, [], $msg, 500);
        }
    }
}

// ==================== APPOINTMENTS ====================
elseif ($endpoint === 'appointments') {
    if ($method === 'GET') {
        $type = $_GET['type'] ?? 'upcoming';
        
        try {
            if ($type === 'upcoming') {
                $stmt = $mysqli->prepare("
                    SELECT 
                        a.appointment_id,
                        a.appointment_date,
                        a.reason_for_visit,
                        a.status,
                        CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                        s.specialty_name,
                        o.name as office_name,
                        o.phone as office_phone,
                        CONCAT(o.address, ', ', o.city, ', ', o.state, ' ', o.zipcode) as office_address
                    FROM appointment a
                    LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
                    LEFT JOIN specialty s ON d.specialty = s.specialty_id
                    LEFT JOIN office o ON a.office_id = o.office_id
                    WHERE a.patient_id = ? 
                    AND a.appointment_date >= NOW()
                    ORDER BY a.appointment_date ASC
                ");
                $stmt->bind_param('i', $patient_id);
            } else {
                // History: include past Appointments (appointment_date < NOW()) and completed PatientVisit records
                // UNION both types so frontend can show a combined history sorted by date.
                $stmt = $mysqli->prepare(
                    "SELECT
                        a.appointment_id AS id,
                        a.appointment_date AS date,
                        a.reason_for_visit AS reason,
                        CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
                        'Appointment' AS item_type,
                        o.name AS office_name,
                        'Scheduled' AS status
                    FROM appointment a
                    LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
                    LEFT JOIN office o ON a.office_id = o.office_id
                    WHERE a.patient_id = ?
                    AND a.appointment_date < NOW()
                    UNION
                    SELECT
                        v.visit_id AS id,
                        v.date AS date,
                        v.reason_for_visit AS reason,
                        CONCAT(d2.first_name, ' ', d2.last_name) AS doctor_name,
                        'Visit' AS item_type,
                        NULL AS office_name,
                        v.status AS status
                    FROM patient_visit v
                    LEFT JOIN doctor d2 ON v.doctor_id = d2.doctor_id
                    WHERE v.patient_id = ?
                    AND v.status = 'Completed'
                    ORDER BY date DESC"
                );
                $stmt->bind_param('ii', $patient_id, $patient_id);
            }
            
            $stmt->execute();
            $result = $stmt->get_result();
            $appointments = $result->fetch_all(MYSQLI_ASSOC);
            
            sendResponse(true, $appointments);
            
        } catch (Exception $e) {
            error_log("Appointments error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to load appointments', 500);
        }
    } 
    elseif ($method === 'POST') {
    // Book new appointment
    $raw_input = file_get_contents('php://input');
    
    // Try to clean the input and decode
    $cleaned_input = trim($raw_input);
    $input = json_decode($cleaned_input, true);
    
    // If that fails, try without associative array flag
    if (!is_array($input)) {
        $input = json_decode($cleaned_input);
        if (is_object($input)) {
            $input = (array) $input; // Convert object to array
        }
    }
    
    // Check both JSON errors and if result is actually an array
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse(false, [], 'Invalid JSON data: ' . json_last_error_msg(), 400);
    }
    
    if (!is_array($input)) {
        sendResponse(false, [], 'JSON parsing failed - invalid data format', 400);
    }
    
    $required = ['doctor_id', 'office_id', 'appointment_date', 'reason'];
    $missing = validateRequired($input, $required);
    
    if (!empty($missing)) {
        sendResponse(false, [], 'Missing required fields: ' . implode(', ', $missing), 400);
    }
    
    try {
        $mysqli->begin_transaction();
        
        // Check if selected doctor is patient's PCP (implement restriction in PHP for now)
        $stmt = $mysqli->prepare("SELECT primary_doctor FROM patient WHERE patient_id = ?");
        $stmt->bind_param('i', $patient_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $patient_data = $result->fetch_assoc();
        $patient_pcp_id = $patient_data['primary_doctor'] ?? null;
        
        // Enforce PCP-only booking rule
        if ($patient_pcp_id === null || $input['doctor_id'] != $patient_pcp_id) {
            $mysqli->rollback();
            sendResponse(false, [], 'You can only book appointments with your Primary Care Physician. To see other doctors, please get a referral from your PCP first.', 400);
        }
        
        // Generate appointment ID
        $result = $mysqli->query("SELECT COALESCE(MAX(Appointment_id), 0) + 1 as next_id FROM Appointment");
        $row = $result->fetch_assoc();
        $next_id = $row['next_id'];
        
        // Parse the appointment_date string to convert time format
        $appointmentdateTime = $input['appointment_date'];
        
        if (strpos($appointmentdateTime, 'AM') !== false || strpos($appointmentdateTime, 'PM') !== false) {
            $dt = dateTime::createFromFormat('Y-m-d g:i A', $appointmentdateTime);
            if ($dt) {
                $appointmentdateTime = $dt->format('Y-m-d H:i:s');
            }
        }
        
        // Temporarily disable foreign key checks for cross-platform compatibility
        $mysqli->query("SET FOREIGN_KEY_CHECKS=0");
        
        // Insert appointment with explicit status for PCP appointments
        $stmt = $mysqli->prepare("
            INSERT INTO appointment (
                Appointment_id, Patient_id, Doctor_id, Office_id, 
                Appointment_date, Date_created, Reason_for_visit, Status
            ) VALUES (?, ?, ?, ?, ?, NOW(), ?, 'Scheduled')
        ");
        $stmt->bind_param('iiiiss',
            $next_id,
            $patient_id,
            $input['doctor_id'],
            $input['office_id'],
            $appointmentdateTime,
            $input['reason']
        );
        
        $exec_result = $stmt->execute();
        
        // Re-enable foreign key checks
        $mysqli->query("SET FOREIGN_KEY_CHECKS=1");
        
        if (!$exec_result) {
            $error_msg = $stmt->error;
            $mysqli->rollback();
            
            // Check for trigger validation errors
            if (strpos($error_msg, 'Cannot create appointment in the past') !== false) {
                sendResponse(false, [], 'Cannot schedule an appointment in the past. Please select a future date and time.', 400);
                exit();
            } elseif (strpos($error_msg, 'Cannot schedule appointment more than 1 year in advance') !== false) {
                sendResponse(false, [], 'Cannot schedule appointments more than 1 year in advance.', 400);
                exit();
            } elseif (strpos($error_msg, 'Appointments must be scheduled between') !== false) {
                sendResponse(false, [], 'Appointments must be scheduled during business hours (8 AM - 6 PM).', 400);
                exit();
            } elseif (strpos($error_msg, 'cannot be scheduled on weekends') !== false) {
                sendResponse(false, [], 'Appointments cannot be scheduled on weekends. Please select a weekday.', 400);
                exit();
            } elseif (strpos($error_msg, 'This time slot is already booked') !== false) {
                sendResponse(false, [], 'This time slot is already booked. Please select a different time.', 400);
                exit();
            } elseif (strpos($error_msg, 'must have a referral') !== false) {
                sendResponse(false, [], 'You must have a referral to book an appointment with a specialist. Please contact your primary care physician.', 400);
                exit();
            } elseif (strpos($error_msg, 'You must select your Primary Care Physician') !== false) {
                sendResponse(false, [], 'You can only book appointments with your Primary Care Physician. To see other doctors, please get a referral from your PCP first.', 400);
                exit();
            } elseif (strpos($error_msg, 'must select your Primary Care Physician') !== false) {
                sendResponse(false, [], 'You can only book appointments with your Primary Care Physician. To see other doctors, please get a referral from your PCP first.', 400);
                exit();
            } else {
                // Generic error
                error_log("Book appointment error: " . $error_msg);
                sendResponse(false, [], 'Failed to book appointment. Please try again.', 500);
                exit();
            }
        }
        
        if ($stmt->affected_rows === 0) {
            $mysqli->rollback();
            throw new Exception('Failed to insert appointment');
        }
        
        $mysqli->commit();
        sendResponse(true, ['appointment_id' => $next_id], 'Appointment booked successfully!');
        
        } catch (Exception $e) {
    $mysqli->rollback();
    error_log("Book appointment error: " . $e->getMessage());
    
    $error_msg = $e->getMessage();
    if (strpos($error_msg, 'Cannot create appointment') !== false || 
        strpos($error_msg, 'Appointments must be scheduled') !== false ||
        strpos($error_msg, 'cannot be scheduled on weekends') !== false ||
        strpos($error_msg, 'This time slot is already booked') !== false ||
        strpos($error_msg, 'must have a referral') !== false ||
        strpos($error_msg, 'You must select your Primary Care Physician') !== false) {
        // For PCP-only trigger error, provide user-friendly message
        if (strpos($error_msg, 'You must select your Primary Care Physician') !== false) {
            sendResponse(false, [], 'You can only book appointments with your Primary Care Physician. To see other doctors, please get a referral from your PCP first.', 400);
            exit();
        } else {
            sendResponse(false, [], $error_msg, 400);
            exit();
        }
    } else {
        sendResponse(false, [], 'Failed to book appointment. Please try again.', 500);
        exit();
    }
}
}
    
    elseif ($method === 'DELETE') {
        // Cancel appointment
        $appointment_id = $_GET['id'] ?? null;
        
        if (!$appointment_id) {
            sendResponse(false, [], 'Appointment ID required', 400);
        }
        
        try {
            $stmt = $mysqli->prepare("                DELETE FROM appointment 
                WHERE appointment_id = ? 
                AND patient_id = ?
            ");
            $stmt->bind_param('ii', $appointment_id, $patient_id);
            $stmt->execute();
            
            sendResponse(true, [], 'Appointment cancelled successfully');
            
        } catch (Exception $e) {
            error_log("Cancel appointment error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to cancel appointment', 500);
        }
    }
}

// ==================== DOCTORS ====================
elseif ($endpoint === 'doctors') {
    if ($method === 'GET') {
        try {
            $specialty_filter = $_GET['specialty'] ?? null;
            
            $query = "\n                SELECT 
                    d.doctor_id,
                    CONCAT(d.first_name, ' ', d.last_name) as name,
                    s.specialty_name,
                    o.name as office_name,
                    CONCAT(o.address, ', ', o.city, ', ', o.state) as location
                FROM doctor d
                LEFT JOIN specialty s ON d.specialty = s.specialty_id
                LEFT JOIN office o ON d.work_location = o.office_id
            ";
            
            // Add WHERE clause if specialty filter is provided
            if ($specialty_filter) {
                $query .= " WHERE s.specialty_name = ?";
            }
            
            $query .= " ORDER BY d.last_name, d.first_name";
            
            if ($specialty_filter) {
                $stmt = $mysqli->prepare($query);
                $stmt->bind_param('s', $specialty_filter);
                $stmt->execute();
                $result = $stmt->get_result();
            } else {
                $result = $mysqli->query($query);
            }
            
            $doctors = $result->fetch_all(MYSQLI_ASSOC);
            sendResponse(true, $doctors);
            
        } catch (Exception $e) {
            error_log("Doctors error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to load doctors', 500);
        }
    }
}

// ==================== OFFICES ====================
elseif ($endpoint === 'offices') {
    if ($method === 'GET') {
        try {
            $result = $mysqli->query("
                SELECT 
                    office_id,
                    name,
                    CONCAT(address, ', ', city, ', ', state, ' ', zipcode) as full_address,
                    phone
                FROM office
                ORDER BY name
            ");
            
            if (!$result) {
                sendResponse(false, [], 'Database query failed: ' . $mysqli->error, 500);
                return;
            }
            
            $offices = $result->fetch_all(MYSQLI_ASSOC);
            sendResponse(true, $offices);
            
        } catch (Exception $e) {
            error_log("Offices error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to load offices: ' . $e->getMessage(), 500);
        }
    }
}

// ==================== VISIT DETAILS ====================
elseif ($endpoint === 'visit') {
    if ($method === 'GET') {
        $visit_id = $_GET['id'] ?? null;
        
        if (!$visit_id) {
            sendResponse(false, [], 'Visit ID is required', 400);
        }
        
        try {
            $stmt = $mysqli->prepare("
                SELECT 
                    v.visit_id,
                    v.date,
                    v.reason_for_visit,
                    v.diagnosis,
                    v.treatment,
                    v.blood_pressure,
                    v.temperature,
                    CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                    s.specialty_name,
                    o.name as office_name,
                    CONCAT(o.address, ', ', o.city, ', ', o.state, ' ', o.zipcode) as office_address
                FROM patient_visit v
                LEFT JOIN doctor d ON v.doctor_id = d.doctor_id
                LEFT JOIN specialty s ON d.specialty = s.specialty_id
                LEFT JOIN office o ON v.office_id = o.office_id
                WHERE v.visit_id = ? AND v.patient_id = ?
            ");
            $stmt->bind_param('ii', $visit_id, $patient_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $visit = $result->fetch_assoc();
            
            if (!$visit) {
                sendResponse(false, [], 'Visit not found', 404);
            }
            
            sendResponse(true, $visit);
            
        } catch (Exception $e) {
            error_log("Visit details error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to load visit details', 500);
        }
    }
}

// ==================== MEDICAL RECORDS ====================
elseif ($endpoint === 'medical-records') {
    $type = $_GET['type'] ?? '';
    
    if ($method === 'GET') {
        try {
            switch ($type) {
                case 'vitals':
                    // Return vaccination history instead of vitals
                    $stmt = $mysqli->prepare("
                        SELECT 
                            vaccination_name as vaccine,
                            DATE(date_of_vaccination) as date_given,
                            DATE(date_for_booster) as booster_due
                        FROM vaccination_history
                        WHERE patient_id = ?
                        ORDER BY date_of_vaccination DESC
                        LIMIT 10
                    ");
                    $stmt->bind_param('i', $patient_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $vaccinations = $result->fetch_all(MYSQLI_ASSOC);
                    sendResponse(true, $vaccinations);
                    break;
                    
                case 'medications':
                    $stmt = $mysqli->prepare("
                        SELECT 
                            mh.drug_name as name,
                            mh.duration_and_frequency_of_drug_use as frequency,
                            'Patient History' as prescribed_by,
                            NULL as start_date,
                            NULL as end_date
                        FROM medication_history mh
                        WHERE mh.patient_id = ?
                        ORDER BY mh.drug_id DESC
                    ");
                    $stmt->bind_param('i', $patient_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $medications = $result->fetch_all(MYSQLI_ASSOC);
                    sendResponse(true, $medications);
                    break;
                    
                case 'allergies':
                    $stmt = $mysqli->prepare("
                        SELECT ca.allergies_text as allergy
                        FROM patient p
                        LEFT JOIN codes_allergies ca ON p.allergies = ca.allergies_code
                        WHERE p.patient_id = ?
                    ");
                    $stmt->bind_param('i', $patient_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $allergy = $result->fetch_assoc();
                    $allergies = $allergy && $allergy['allergy'] ? [$allergy['allergy']] : [];
                    sendResponse(true, $allergies);
                    break;
                    
                case 'all-allergies':
                    // Get all available allergies for dropdown
                    $stmt = $mysqli->prepare("
                        SELECT allergies_code as code, allergies_text as text
                        FROM codes_allergies 
                        ORDER BY allergies_text
                    ");
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $all_allergies = $result->fetch_all(MYSQLI_ASSOC);
                    sendResponse(true, $all_allergies);
                    break;
                    
                case 'conditions':
                    $stmt = $mysqli->prepare("
                        SELECT 
                            condition_name as name,
                            diagnosis_date as diagnosis_date
                        FROM medical_condition
                        WHERE patient_id = ?
                        ORDER BY diagnosis_date DESC
                    ");
                    $stmt->bind_param('i', $patient_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $conditions = $result->fetch_all(MYSQLI_ASSOC);
                    sendResponse(true, $conditions);
                    break;
                    
                case 'visit-summaries':
                    $stmt = $mysqli->prepare("
                        SELECT 
                            v.visit_id as visit_id,
                            v.date as date,
                            v.reason_for_visit as reason_for_visit,
                            CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                            v.diagnosis as diagnosis,
                            v.treatment as treatment,
                            v.blood_pressure as blood_pressure,
                            v.temperature as temperature
                        FROM patient_visit v
                        LEFT JOIN doctor d ON v.doctor_id = d.doctor_id
                        WHERE v.patient_id = ?
                        AND v.status = 'Completed'
                        ORDER BY v.date DESC
                        LIMIT 20
                    ");
                    $stmt->bind_param('i', $patient_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $summaries = $result->fetch_all(MYSQLI_ASSOC);
                    sendResponse(true, $summaries);
                    break;
                    
                default:
                    sendResponse(false, [], 'Invalid medical record type', 400);
            }
            
        } catch (Exception $e) {
            error_log("Medical records error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to load medical records', 500);
        }
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $type = $_GET['type'] ?? '';
        
        try {
            switch ($type) {
                case 'medications':
                    // Add to medication_history table
                    $drug_name = $input['medication_name'] ?? $input['drug_name'] ?? '';
                    $duration_frequency = '';
                    
                    // Combine dosage and frequency into duration_and_frequency_of_drug_use
                    if (!empty($input['dosage']) && !empty($input['frequency'])) {
                        $duration_frequency = $input['dosage'] . ' - ' . $input['frequency'];
                    } elseif (!empty($input['duration_frequency'])) {
                        $duration_frequency = $input['duration_frequency'];
                    } else {
                        $duration_frequency = 'As directed';
                    }
                    
                    $stmt = $mysqli->prepare("
                        INSERT INTO medication_history (patient_id, drug_name, duration_and_frequency_of_drug_use)
                        VALUES (?, ?, ?)
                    ");
                    $stmt->bind_param('iss',
                        $patient_id,
                        $drug_name,
                        $duration_frequency
                    );
                    $stmt->execute();
                    
                    sendResponse(true, ['id' => $mysqli->insert_id], 'Medication added successfully');
                    break;
                    
                case 'allergies':
                    // Check if allergy exists in codes_allergies
                    $stmt = $mysqli->prepare("
                        SELECT allergies_code FROM codes_allergies WHERE allergies_text = ?
                    ");
                    $stmt->bind_param('s', $input['allergy_text']);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $existing_allergy = $result->fetch_assoc();
                    
                    if ($existing_allergy) {
                        // Use existing allergy code
                        $allergy_code = $existing_allergy['allergies_code'];
                    } else {
                        // Add new allergy to codes_allergies
                        $stmt2 = $mysqli->prepare("
                            INSERT INTO codes_allergies (allergies_text) VALUES (?)
                        ");
                        $stmt2->bind_param('s', $input['allergy_text']);
                        $stmt2->execute();
                        $allergy_code = $mysqli->insert_id;
                    }
                    
                    // Update patient's allergies field
                    $stmt3 = $mysqli->prepare("
                        UPDATE patient SET allergies = ? WHERE patient_id = ?
                    ");
                    $stmt3->bind_param('ii', $allergy_code, $patient_id);
                    $stmt3->execute();
                    
                    sendResponse(true, ['allergy_code' => $allergy_code], 'Allergy updated successfully');
                    break;
                    
                default:
                    sendResponse(false, [], 'Invalid medical record type for POST', 400);
            }
            
        } catch (Exception $e) {
            error_log("Medical records POST error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to update medical records', 500);
        }
    }
}

// ==================== INSURANCE ====================
elseif ($endpoint === 'insurance') {
    if ($method === 'GET') {
        try {
            $stmt = $mysqli->prepare("                SELECT 
                    pi.id,
                    pi.member_id,
                    pi.group_id,
                    pi.effective_date,
                    pi.expiration_date,
                    pi.is_primary,
                    pi.copay,
                    pi.deductible_individ,
                    pi.coinsurance_rate_pct,
                    ip.NAME as provider_name,
                    ipl.plan_name,
                    ipl.plan_type
                FROM patient_insurance pi
                LEFT JOIN insurance_plan ipl ON pi.plan_id = ipl.plan_id
                LEFT JOIN insurance_payer ip ON ipl.payer_id = ip.payer_id
                WHERE pi.patient_id = ?
                ORDER BY pi.is_primary DESC, pi.effective_date DESC
            ");
            $stmt->bind_param('i', $patient_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $insurance = $result->fetch_all(MYSQLI_ASSOC);
            
            sendResponse(true, $insurance);
            
        } catch (Exception $e) {
            error_log("Insurance error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to load insurance', 500);
        }
    }
}

// ==================== BILLING ====================
elseif ($endpoint === 'billing') {
    $type = $_GET['type'] ?? '';
    
    if ($method === 'GET') {
        try {
            switch ($type) {
                case 'balance':
                    error_log("Billing balance query for patient_id: " . $patient_id);
                    $stmt = $mysqli->prepare("
                        SELECT 
                            COALESCE(SUM(total_due), 0) as outstanding_balance,
                            COUNT(*) as visit_count
                        FROM patient_visit
                        WHERE patient_id = ?
                        AND total_due > 0
                    ");
                    $stmt->bind_param('i', $patient_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $balance = $result->fetch_assoc();
                    error_log("Billing balance result: " . json_encode($balance));
                    sendResponse(true, $balance);
                    break;
                    
                case 'statements':
                    error_log("Billing statements query for patient_id: " . $patient_id);
                    $stmt = $mysqli->prepare("
                        SELECT 
                            v.visit_id as id,
                            DATE(v.date) as date,
                            v.reason_for_visit as service,
                            v.amount_due as amount,
                            v.total_due as balance,
                            CASE 
                                WHEN v.total_due = 0 THEN 'Paid'
                                WHEN v.payment > 0 THEN 'Partial payment'
                                ELSE 'Unpaid'
                            END as status,
                            v.payment
                        FROM patient_visit v
                        WHERE v.patient_id = ?
                        AND v.amount_due IS NOT NULL
                        ORDER BY v.date DESC
                        LIMIT 50
                    ");
                    $stmt->bind_param('i', $patient_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $statements = $result->fetch_all(MYSQLI_ASSOC);
                    error_log("Billing statements result count: " . count($statements));
                    sendResponse(true, $statements);
                    break;
                    
                default:
                    sendResponse(false, [], 'Invalid billing type', 400);
            }
            
        } catch (Exception $e) {
            error_log("Billing error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to load billing information', 500);
        }
    } elseif ($method === 'POST') {
        try {
            // Process a payment for a visit
            $input = json_decode(file_get_contents('php://input'), true);
            $visit_id = isset($input['visit_id']) ? (int)$input['visit_id'] : null;
            $amount = isset($input['amount']) ? floatval($input['amount']) : 0;

            if ($amount <= 0) {
                sendResponse(false, [], 'Invalid payment amount', 400);
            }

            if ($visit_id) {
                $stmt = $mysqli->prepare("SELECT total_due, payment FROM patient_visit WHERE visit_id = ? AND patient_id = ? LIMIT 1");
                $stmt->bind_param('ii', $visit_id, $patient_id);
                $stmt->execute();
                $res = $stmt->get_result();
                $row = $res->fetch_assoc();
                if (!$row) {
                    sendResponse(false, [], 'Visit not found', 404);
                }

                $currentpayment = floatval($row['payment'] ?? 0);
                $currentDue = floatval($row['total_due'] ?? 0);
                $newpayment = $currentpayment + $amount;
                $newDue = max(0, $currentDue - $amount);

                $stmt = $mysqli->prepare("UPDATE patient_visit SET payment = ?, total_due = ? WHERE visit_id = ? AND patient_id = ?");
                $stmt->bind_param('ddii', $newpayment, $newDue, $visit_id, $patient_id);
                $stmt->execute();

                sendResponse(true, ['visit_id' => $visit_id, 'paid' => $amount, 'new_balance' => $newDue], 'payment processed');
            } else {
                // No visit specified: apply as credit (not implemented fully).
                sendResponse(false, [], 'Visit id required for payment', 400);
            }
        } catch (Exception $e) {
            error_log('payment error: ' . $e->getMessage());
            sendResponse(false, [], 'Failed to process payment', 500);
        } catch (Exception $e) {
            error_log('payment error: ' . $e->getMessage());
            sendResponse(false, [], 'Failed to process payment', 500);
        }
    }
}

// Invalid endpoint
else {
    sendResponse(false, [], 'Invalid endpoint', 404);
}

$mysqli->close();
?>
