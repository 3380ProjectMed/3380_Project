<?php
// patient_api.php - Patient Portal API Endpoints

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/api/session.php';
header('Content-Type: application/json');

// Azure App Service HTTPS detection

error_log("Patient API: Session started with ID: " . session_id());
error_log("Patient API: Session data after start: " . json_encode($_SESSION));

// Helper functions
function requireAuth($allowed_roles = ['PATIENT'])
{
    error_log("=== PATIENT API AUTH DEBUG ===");
    error_log("Patient API: Full session data = " . json_encode($_SESSION));
    error_log("Patient API: Session ID = " . session_id());
    error_log("Patient API: HTTP Headers = " . json_encode(getallheaders()));
    error_log("===============================");

    // Check if session data is completely empty but we have a session ID
    if (empty($_SESSION) && session_id()) {
        error_log("Patient API: Empty session but session ID exists - possible session storage issue");
        // Try to regenerate session ID in case of corruption
        session_regenerate_id(false);
        error_log("Patient API: Regenerated session ID: " . session_id());
    }

    if (!isset($_SESSION['uid']) || !isset($_SESSION['email'])) {
        error_log("Patient API: Missing basic session data");
        sendResponse(false, [], 'User not properly authenticated', 401);
        exit();
    }

    // Check if patient_id exists and belongs to current session email
    if (isset($_SESSION['patient_id'])) {
        $session_patient_id = $_SESSION['patient_id'];
        $user_email = $_SESSION['email'];
        
        try {
            $mysqli = getDBConnection();
            $stmt = $mysqli->prepare("SELECT patient_id FROM patient WHERE patient_id = ? AND email = ? LIMIT 1");
            $stmt->bind_param('is', $session_patient_id, $user_email);
            $stmt->execute();
            $result = $stmt->get_result();
            $patient = $result->fetch_assoc();
            $stmt->close();

            if (!$patient) {
                error_log("Patient API: Cached patient_id " . $session_patient_id . " does not belong to email " . $user_email . " - clearing session");
                unset($_SESSION['patient_id']);
            } else {
                error_log("Patient API: Validated cached patient_id = " . $session_patient_id);
            }
        } catch (Exception $e) {
            error_log("Patient auth validation error - " . $e->getMessage());
            unset($_SESSION['patient_id']);
        }
    }

    if (!isset($_SESSION['patient_id'])) {
        $user_email = $_SESSION['email'];
        error_log("Patient API: Looking up patient_id for email = " . $user_email);

        try {
            $mysqli = getDBConnection();
            $stmt = $mysqli->prepare("SELECT patient_id, first_name, last_name, email FROM patient WHERE email = ? LIMIT 1");
            $stmt->bind_param('s', $user_email);
            $stmt->execute();
            $result = $stmt->get_result();
            $patient = $result->fetch_assoc();
            $stmt->close();

            if ($patient) {
                $_SESSION['patient_id'] = $patient['patient_id'];
                $_SESSION['role'] = 'PATIENT';
                $_SESSION['username'] = strtolower($patient['first_name'] . $patient['last_name']);
                error_log("Patient auth: Set patient_id = " . $patient['patient_id'] . " for email = " . $user_email);
            } else {
                error_log("Patient auth: No patient found for email = " . $user_email);
                sendResponse(false, [], 'No patient record found for logged-in user', 403);
                exit();
            }
        } catch (Exception $e) {
            error_log("Patient auth: Database error - " . $e->getMessage());
            sendResponse(false, [], 'Authentication error: ' . $e->getMessage(), 500);
            exit();
        }
    }
}

function sendResponse($success, $data = [], $message = '', $statusCode = 200)
{
    $response = [
        'success' => $success,
        'data' => $data,
        'message' => $message
    ];

    if (!$success && $statusCode == 401) {
        $response['debug'] = [
            'session_id' => session_id(),
            'session_data' => $_SESSION,
            'cookies' => $_COOKIE,
            'has_phpsessid_cookie' => isset($_COOKIE['PHPSESSID'])
        ];
    }

    http_response_code($statusCode);
    echo json_encode($response, JSON_PRETTY_PRINT);
    exit();
}

function validateRequired($input, $required_fields)
{
    $missing = [];
    if (!is_array($input)) {
        return $required_fields;
    }
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            $missing[] = $field;
        }
    }
    return $missing;
}

// Database connection
try {
    $mysqli = getDBConnection();
} catch (Exception $e) {
    sendResponse(false, [], 'Database connection error: ' . $e->getMessage(), 500);
}

requireAuth(['PATIENT']);

$patient_id = $_SESSION['patient_id'] ?? null;
$session_email = $_SESSION['email'] ?? null;

error_log("=== PATIENT ID VALIDATION ===");
error_log("Session ID: " . session_id());
error_log("Session email: " . ($session_email ?? 'NULL'));
error_log("Session patient_id: " . ($patient_id ?? 'NULL'));
error_log("Full session: " . json_encode($_SESSION));
error_log("============================");

// Patient ID should now be properly set by requireAuth function
if (!$patient_id) {
    $user_email = $_SESSION['email'] ?? null;
    error_log("FALLBACK: patient_id still null after requireAuth for email: " . ($user_email ?? 'NULL'));
    sendResponse(false, [], 'Patient authentication failed', 403);
}

if (!$patient_id) {
    sendResponse(false, [], 'Patient ID not found for authenticated user', 400);
}

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = $_GET['endpoint'] ?? '';

// Test endpoint
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
                    CONCAT(doc_staff.first_name, ' ', doc_staff.last_name) as doctor_name,
                    s.specialty_name,
                    o.name as office_name,
                    CONCAT(o.address, ', ', o.city, ', ', o.state, ' ', o.zipcode) as office_address
                FROM appointment a
                LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
                LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
                LEFT JOIN specialty s ON d.specialty = s.specialty_id
                LEFT JOIN office o ON a.office_id = o.office_id
                WHERE a.patient_id = ? 
                AND a.appointment_date >= NOW()
                ORDER BY a.appointment_date ASC
            ");
            $stmt->bind_param('i', $patient_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $upcoming_appointments = $result->fetch_all(MYSQLI_ASSOC);

            // Get PCP info
            $stmt = $mysqli->prepare("
                SELECT 
                    d.doctor_id,
                    CONCAT(doc_staff.first_name, ' ', doc_staff.last_name) as name,
                    s.specialty_name,
                    GROUP_CONCAT(DISTINCT o.name SEPARATOR ', ') as office_name,
                    d.phone,
                    doc_staff.staff_email,
                    GROUP_CONCAT(DISTINCT CONCAT(o.address, ', ', o.city, ', ', o.state) SEPARATOR ' | ') as location
                FROM patient p
                LEFT JOIN doctor d ON p.primary_doctor = d.doctor_id
                LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
                LEFT JOIN specialty s ON d.specialty = s.specialty_id
                LEFT JOIN work_schedule ws ON doc_staff.staff_id = ws.staff_id
                LEFT JOIN office o ON ws.office_id = o.office_id
                WHERE p.patient_id = ?
                GROUP BY d.doctor_id, doc_staff.staff_id, s.specialty_id
            ");
            $stmt->bind_param('i', $patient_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $pcp = $result->fetch_assoc();
            
            // Convert empty PCP result to null for proper frontend handling
            if (empty($pcp) || empty($pcp['name'])) {
                $pcp = null;
            }

            // Get recent visits
            $stmt = $mysqli->prepare("
                SELECT 
                    v.visit_id,
                    v.date,
                    CONCAT(doc_staff.first_name, ' ', doc_staff.last_name) as doctor_name,
                    v.status,
                    (COALESCE(v.copay_amount_due, 0) + COALESCE(v.treatment_cost_due, 0)) as total_due,
                    'visit' as activity_type,
                    v.reason_for_visit as description
                FROM patient_visit v
                LEFT JOIN doctor d ON v.doctor_id = d.doctor_id
                LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
                WHERE v.patient_id = ?
                ORDER BY v.date DESC
                LIMIT 3
            ");
            $stmt->bind_param('i', $patient_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $recent_activity = $result->fetch_all(MYSQLI_ASSOC);

            // Get approved referrals (notifications) with expiration info
            $stmt = $mysqli->prepare("
                SELECT 
                    r.referral_id as visit_id,
                    r.date_of_approval as date,
                    CONCAT('You may now book with Dr. ', spec_staff.last_name, ' (', s.specialty_name, ')') as doctor_name,
                    'Referral Approved' as status,
                    0 as total_due,
                    'referral' as activity_type,
                    r.reason as description,
                    d.doctor_id as specialist_id,
                    CONCAT(spec_staff.first_name, ' ', spec_staff.last_name) as specialist_name,
                    s.specialty_name as specialty,
                    DATE_ADD(r.date_of_approval, INTERVAL 90 DAY) as expiration_date,
                    DATEDIFF(DATE_ADD(r.date_of_approval, INTERVAL 90 DAY), CURDATE()) as days_remaining,
                    CASE 
                        WHEN DATEDIFF(DATE_ADD(r.date_of_approval, INTERVAL 90 DAY), CURDATE()) <= 7 THEN 'urgent'
                        WHEN DATEDIFF(DATE_ADD(r.date_of_approval, INTERVAL 90 DAY), CURDATE()) <= 30 THEN 'warning'
                        ELSE 'normal'
                    END as urgency_level
                FROM referral r
                LEFT JOIN doctor d ON r.specialist_doctor_staff_id = d.doctor_id
                LEFT JOIN staff spec_staff ON d.staff_id = spec_staff.staff_id
                LEFT JOIN specialty s ON d.specialty = s.specialty_id
                WHERE r.patient_id = ?
                AND r.date_of_approval IS NOT NULL
                AND r.appointment_id IS NULL
                AND DATE_ADD(r.date_of_approval, INTERVAL 90 DAY) >= CURDATE()
                ORDER BY 
                    CASE 
                        WHEN DATEDIFF(DATE_ADD(r.date_of_approval, INTERVAL 90 DAY), CURDATE()) <= 7 THEN 0
                        WHEN DATEDIFF(DATE_ADD(r.date_of_approval, INTERVAL 90 DAY), CURDATE()) <= 30 THEN 1
                        ELSE 2
                    END,
                    r.date_of_approval DESC
                LIMIT 3
            ");
            $stmt->bind_param('i', $patient_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $referral_notifications = $result->fetch_all(MYSQLI_ASSOC);

            // Merge recent activity with referral notifications
            $all_activity = array_merge($referral_notifications, $recent_activity);
            usort($all_activity, function ($a, $b) {
                return strtotime($b['date']) - strtotime($a['date']);
            });
            $recent_activity = array_slice($all_activity, 0, 5);

            sendResponse(true, [
                'upcoming_appointments' => $upcoming_appointments,
                'pcp' => $pcp,
                'recent_activity' => $recent_activity
            ]);
        } catch (Exception $e) {
            error_log("Dashboard error: " . $e->getMessage());
            error_log("Dashboard error trace: " . $e->getTraceAsString());
            sendResponse(false, [], 'Failed to load dashboard', 500);
        }
    }
}

// ==================== PROFILE ====================
elseif ($endpoint === 'profile') {
    if ($method === 'GET') {
        try {
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
                    CONCAT(doc_staff.first_name, ' ', doc_staff.last_name) as pcp_name,
                    d.doctor_id as pcp_id,
                    s.specialty_name as pcp_specialty,
                    GROUP_CONCAT(DISTINCT o.name SEPARATOR ', ') as pcp_office,
                    d.phone as pcp_phone,
                    doc_staff.staff_email as pcp_email,
                    GROUP_CONCAT(DISTINCT CONCAT(o.address, ', ', o.city, ', ', o.state) SEPARATOR ' | ') as pcp_location,
                    cg.gender_text as Gender_Text,
                    cag.gender_text as AssignedAtBirth_Gender_Text,
                    ce.ethnicity_text as Ethnicity_Text,
                    cr.race_text as Race_Text
                FROM patient p
                LEFT JOIN emergency_contact ec ON p.emergency_contact_id = ec.emergency_contact_id
                LEFT JOIN doctor d ON p.primary_doctor = d.doctor_id
                LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
                LEFT JOIN specialty s ON d.specialty = s.specialty_id
                LEFT JOIN work_schedule ws ON doc_staff.staff_id = ws.staff_id
                LEFT JOIN office o ON ws.office_id = o.office_id
                LEFT JOIN codes_gender cg ON p.gender = cg.gender_code
                LEFT JOIN codes_assigned_at_birth_gender cag ON p.assigned_at_birth_gender = cag.gender_code
                LEFT JOIN codes_ethnicity ce ON p.ethnicity = ce.ethnicity_code
                LEFT JOIN codes_race cr ON p.race = cr.race_code
                WHERE p.patient_id = ?
                GROUP BY p.patient_id, d.doctor_id, doc_staff.staff_id, s.specialty_id, 
                        cg.gender_code, cag.gender_code, ce.ethnicity_code, cr.race_code"
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
    } elseif ($method === 'PUT') {
        $raw_input = file_get_contents('php://input');
        $input = json_decode($raw_input, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendResponse(false, [], 'Invalid JSON data: ' . json_last_error_msg(), 400);
        }

        try {
            $mapTextToCode = function ($table, $idCol, $textCol, $val) use ($mysqli) {
                $val = trim((string) ($val ?? ''));
                if ($val === '') return '';
                if (is_numeric($val)) return (string) intval($val);
                $sql = "SELECT $idCol FROM $table WHERE $textCol = ? LIMIT 1";
                $st = $mysqli->prepare($sql);
                if (!$st) return '';
                $st->bind_param('s', $val);
                $st->execute();
                $res = $st->get_result();
                $row = $res ? $res->fetch_assoc() : null;
                $st->close();
                return $row && isset($row[$idCol]) ? (string) $row[$idCol] : '';
            };

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
                sendResponse(false, [], 'Database prepare failed: ' . $mysqli->error, 500);
            }

            $first = $input['first_name'] ?? '';
            $last = $input['last_name'] ?? '';
            $email = $input['email'] ?? '';
            $dob = $input['dob'] ?? '';
            $emergencyContact = $input['emergency_contact'] ?? '';
            $emergencyContactFirstName = $input['emergency_contact_first_name'] ?? '';
            $emergencyContactLastName = $input['emergency_contact_last_name'] ?? '';
            $emergencyContactRelationship = $input['emergency_contact_relationship'] ?? '';
            $gender = $mapTextToCode('codes_gender', 'gender_code', 'gender_text', $input['gender'] ?? '');
            $genderAtBirth = $mapTextToCode('codes_assigned_at_birth_gender', 'gender_code', 'gender_text', $input['genderAtBirth'] ?? '');
            $ethnicity = $mapTextToCode('codes_ethnicity', 'ethnicity_code', 'ethnicity_text', $input['ethnicity'] ?? '');
            $race = $mapTextToCode('codes_race', 'race_code', 'race_text', $input['race'] ?? '');
            $primaryDoctor = isset($input['primary_doctor']) ? trim((string) $input['primary_doctor']) : '';

            $stmt->bind_param(
                'sssssssssi',
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

            if ($stmt->execute() === false) {
                sendResponse(false, [], 'Database execute failed: ' . $stmt->error, 500);
            }

            // Handle emergency contact
            if (!empty($emergencyContact) || !empty($emergencyContactFirstName) || !empty($emergencyContactLastName) || !empty($emergencyContactRelationship)) {
                $checkStmt = $mysqli->prepare("SELECT emergency_contact_id FROM patient WHERE patient_id = ?");
                $checkStmt->bind_param('i', $patient_id);
                $checkStmt->execute();
                $result = $checkStmt->get_result();
                $patientData = $result->fetch_assoc();
                $existingEcId = $patientData['emergency_contact_id'] ?? null;

                if ($existingEcId) {
                    $ecStmt = $mysqli->prepare("UPDATE emergency_contact SET ec_first_name = NULLIF(?, ''), ec_last_name = NULLIF(?, ''), ec_phone = NULLIF(?, ''), relationship = NULLIF(?, '') WHERE emergency_contact_id = ?");
                    $ecStmt->bind_param('ssssi', $emergencyContactFirstName, $emergencyContactLastName, $emergencyContact, $emergencyContactRelationship, $existingEcId);
                    $ecStmt->execute();
                } else {
                    $ecStmt = $mysqli->prepare("INSERT INTO emergency_contact (patient_id, ec_first_name, ec_last_name, ec_phone, relationship) VALUES (?, NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''))");
                    $ecStmt->bind_param('issss', $patient_id, $emergencyContactFirstName, $emergencyContactLastName, $emergencyContact, $emergencyContactRelationship);
                    $ecStmt->execute();
                    $newEcId = $mysqli->insert_id;
                    $updateStmt = $mysqli->prepare("UPDATE patient SET emergency_contact_id = ? WHERE patient_id = ?");
                    $updateStmt->bind_param('ii', $newEcId, $patient_id);
                    $updateStmt->execute();
                }
            }

            sendResponse(true, [], 'Profile updated successfully');
        } catch (Exception $e) {
            error_log("Profile update error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to update profile: ' . $e->getMessage(), 500);
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
                        CONCAT(doc_staff.first_name, ' ', doc_staff.last_name) as doctor_name,
                        s.specialty_name,
                        o.name as office_name,
                        o.phone as office_phone,
                        CONCAT(o.address, ', ', o.city, ', ', o.state, ' ', o.zipcode) as office_address
                    FROM appointment a
                    LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
                    LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
                    LEFT JOIN specialty s ON d.specialty = s.specialty_id
                    LEFT JOIN office o ON a.office_id = o.office_id
                    WHERE a.patient_id = ? 
                    AND a.appointment_date >= NOW()
                    ORDER BY a.appointment_date ASC
                ");
                $stmt->bind_param('i', $patient_id);
            } else {
                $stmt = $mysqli->prepare(
                    "SELECT
                        v.visit_id AS id,
                        v.date AS date,
                        v.reason_for_visit AS reason,
                        CONCAT(doc_staff.first_name, ' ', doc_staff.last_name) AS doctor_name,
                        'Visit' AS item_type,
                        o.name AS office_name,
                        v.status AS status
                    FROM patient_visit v
                    LEFT JOIN doctor d ON v.doctor_id = d.doctor_id
                    LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
                    LEFT JOIN office o ON v.office_id = o.office_id
                    WHERE v.patient_id = ?
                    AND v.status = 'Completed'
                    ORDER BY v.date DESC"
                );
                $stmt->bind_param('i', $patient_id);
            }

            $stmt->execute();
            $result = $stmt->get_result();
            $appointments = $result->fetch_all(MYSQLI_ASSOC);

            sendResponse(true, $appointments);
        } catch (Exception $e) {
            error_log("Appointments error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to load appointments', 500);
        }
    } elseif ($method === 'POST') {
        $raw_input = file_get_contents('php://input');
        $cleaned_input = trim($raw_input);
        $input = json_decode($cleaned_input, true);

        if (!is_array($input)) {
            $input = json_decode($cleaned_input);
            if (is_object($input)) {
                $input = (array) $input;
            }
        }

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

            // Generate appointment ID
            $result = $mysqli->query("SELECT COALESCE(MAX(Appointment_id), 0) + 1 as next_id FROM Appointment");
            $row = $result->fetch_assoc();
            $next_id = $row['next_id'];

            // Parse appointment date
            $appointmentdateTime = $input['appointment_date'];
            if (strpos($appointmentdateTime, 'AM') !== false || strpos($appointmentdateTime, 'PM') !== false) {
                // Try multiple format patterns to handle different time formats
                $formats = [
                    'Y-m-d g:i A',    // 2026-11-12 2:00 PM
                    'Y-m-d h:i A',    // 2026-11-12 02:00 PM
                    'Y-m-d G:i',      // 2026-11-12 14:00
                    'Y-m-d H:i'       // 2026-11-12 14:00
                ];

                $dt = null;
                foreach ($formats as $format) {
                    $dt = DateTime::createFromFormat($format, $appointmentdateTime);
                    if ($dt && $dt->format($format) === $appointmentdateTime) {
                        break;
                    }
                    $dt = null;
                }

                if ($dt) {
                    $appointmentdateTime = $dt->format('Y-m-d H:i:s');
                } else {
                    // Log the parsing error
                    error_log("Date parsing failed for: " . $appointmentdateTime);
                    sendResponse(false, [], 'Invalid date format. Please use YYYY-MM-DD HH:MM AM/PM format.', 400);
                    return;
                }
            }

            // Insert appointment - trigger will validate date/time constraints and PCP/referral requirements
            $stmt = $mysqli->prepare("
                INSERT INTO appointment (
                    Appointment_id, Patient_id, Doctor_id, Office_id, 
                    Appointment_date, Date_created, Reason_for_visit
                ) VALUES (?, ?, ?, ?, ?, NOW(), ?)
            ");
            $stmt->bind_param(
                'iiiiss',
                $next_id,
                $patient_id,
                $input['doctor_id'],
                $input['office_id'],
                $appointmentdateTime,
                $input['reason']
            );

            $exec_result = $stmt->execute();

            if (!$exec_result) {
                $error_msg = $stmt->error;
                $mysqli->rollback();
                error_log("SQL execution failed: " . $error_msg);
                sendResponse(false, [], 'Database error occurred', 500);
                return;
            }

            if ($stmt->affected_rows === 0) {
                $mysqli->rollback();
                throw new Exception('Failed to insert appointment');
            }

            // Check if this is a specialist appointment that needs a referral linked
            $pcp_check = $mysqli->prepare("SELECT Primary_Doctor FROM Patient WHERE Patient_ID = ?");
            $pcp_check->bind_param('i', $patient_id);
            $pcp_check->execute();
            $pcp_result = $pcp_check->get_result();
            $pcp_data = $pcp_result->fetch_assoc();

            // If booking with a specialist (not PCP), link the referral
            if ($pcp_data && $pcp_data['Primary_Doctor'] != $input['doctor_id']) {
                $referral_update = $mysqli->prepare("
                    UPDATE referral 
                    SET appointment_id = ? 
                    WHERE patient_id = ? 
                    AND specialist_doctor_staff_id = ? 
                    AND date_of_approval IS NOT NULL 
                    AND appointment_id IS NULL 
                    ORDER BY date_of_approval ASC 
                    LIMIT 1
                ");
                $referral_update->bind_param('iii', $next_id, $patient_id, $input['doctor_id']);
                $referral_update->execute();
            }

            $mysqli->commit();
            sendResponse(true, ['appointment_id' => $next_id], 'Appointment booked successfully!');
        } catch (Exception $e) {
            $mysqli->rollback();
            error_log("Book appointment error: " . $e->getMessage());
            $error_msg = $e->getMessage();

            // Handle trigger validation errors (these come as exceptions)
            if (strpos($error_msg, 'Cannot create appointment in the past') !== false) {
                sendResponse(false, [], 'Cannot schedule an appointment in the past. Please select a future date and time.', 400);
            } elseif (strpos($error_msg, 'Cannot schedule appointment more than 1 year in advance') !== false) {
                sendResponse(false, [], 'Cannot schedule appointments more than 1 year in advance.', 400);
            } elseif (strpos($error_msg, 'Appointments must be scheduled between 8 AM and 6 PM') !== false) {
                sendResponse(false, [], 'Appointments must be scheduled during business hours (8 AM - 6 PM).', 400);
            } elseif (strpos($error_msg, 'Appointments cannot be scheduled on weekends') !== false) {
                sendResponse(false, [], 'Appointments cannot be scheduled on weekends. Please select a weekday.', 400);
            } elseif (strpos($error_msg, 'This time slot is already booked') !== false) {
                sendResponse(false, [], 'This time slot is already booked. Please select a different time.', 400);
            } elseif (strpos($error_msg, 'must have a referral') !== false) {
                sendResponse(false, [], 'You need a referral from your Primary Care Physician to book with this specialist.', 400);
            } else {
                sendResponse(false, [], 'Failed to book appointment. Please try again.', 500);
            }
        }
    } elseif ($method === 'DELETE') {
        $appointment_id = $_GET['id'] ?? null;

        if (!$appointment_id) {
            sendResponse(false, [], 'Appointment ID required', 400);
        }

        try {
            // Start transaction
            $mysqli->begin_transaction();

            // First, unlink any referral associated with this appointment
            $referral_update = $mysqli->prepare("
                UPDATE referral 
                SET appointment_id = NULL 
                WHERE appointment_id = ?
            ");
            $referral_update->bind_param('i', $appointment_id);
            $referral_update->execute();

            // Then delete the appointment
            $stmt = $mysqli->prepare("
                DELETE FROM appointment 
                WHERE appointment_id = ? 
                AND patient_id = ?
            ");
            $stmt->bind_param('ii', $appointment_id, $patient_id);
            $stmt->execute();

            $mysqli->commit();
            sendResponse(true, [], 'Appointment cancelled successfully');
        } catch (Exception $e) {
            $mysqli->rollback();
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

            $query = "
                SELECT 
                    d.doctor_id,
                    CONCAT(doc_staff.first_name, ' ', doc_staff.last_name) as name,
                    s.specialty_name,
                    COALESCE(GROUP_CONCAT(DISTINCT o.name SEPARATOR ', '), 'Office TBD') as office_name,
                    COALESCE(GROUP_CONCAT(DISTINCT CONCAT(o.address, ', ', o.city, ', ', o.state) SEPARATOR ' | '), 'Location TBD') as location
                FROM doctor d
                LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
                LEFT JOIN specialty s ON d.specialty = s.specialty_id
                LEFT JOIN work_schedule ws ON doc_staff.staff_id = ws.staff_id
                LEFT JOIN office o ON ws.office_id = o.office_id
            ";

            if ($specialty_filter) {
                $query .= " WHERE s.specialty_name = ?";
            }

            $query .= " GROUP BY d.doctor_id, doc_staff.first_name, doc_staff.last_name, s.specialty_name
                       ORDER BY doc_staff.last_name, doc_staff.first_name";

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
                    v.blood_pressure,
                    v.temperature,
                    CONCAT(doc_staff.first_name, ' ', doc_staff.last_name) as doctor_name,
                    s.specialty_name,
                    o.name as office_name,
                    CONCAT(o.address, ', ', o.city, ', ', o.state, ' ', o.zipcode) as office_address
                FROM patient_visit v
                LEFT JOIN doctor d ON v.doctor_id = d.doctor_id
                LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
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
                            mh.drug_id as id,
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
                        SELECT 
                            ca.allergies_code as id,
                            ca.allergies_text as allergy
                        FROM patient p
                        LEFT JOIN codes_allergies ca ON p.allergies = ca.allergies_code
                        WHERE p.patient_id = ? AND ca.allergies_text IS NOT NULL
                    ");
                    $stmt->bind_param('i', $patient_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $allergies = $result->fetch_all(MYSQLI_ASSOC);
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
                            CONCAT(doc_staff.first_name, ' ', doc_staff.last_name) as doctor_name,
                            v.diagnosis as diagnosis,
                            v.blood_pressure as blood_pressure,
                            v.temperature as temperature
                        FROM patient_visit v
                        LEFT JOIN doctor d ON v.doctor_id = d.doctor_id
                        LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
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
                    $stmt->bind_param(
                        'iss',
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
    } elseif ($method === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);
        $type = $_GET['type'] ?? '';
        $item_id = $_GET['id'] ?? $input['id'] ?? null;

        if (!$item_id) {
            sendResponse(false, [], 'ID is required for deletion', 400);
        }

        try {
            switch ($type) {
                case 'medications':
                    // Delete from medication_history table
                    $stmt = $mysqli->prepare("
                        DELETE FROM medication_history 
                        WHERE drug_id = ? AND patient_id = ?
                    ");
                    $stmt->bind_param('ii', $item_id, $patient_id);
                    $stmt->execute();

                    if ($stmt->affected_rows > 0) {
                        sendResponse(true, [], 'Medication deleted successfully');
                    } else {
                        sendResponse(false, [], 'Medication not found', 404);
                    }
                    break;

                case 'allergies':
                    // For allergies, we need to clear the patient's allergy field if it matches
                    // First check if this allergy is assigned to this patient
                    $stmt = $mysqli->prepare("
                        SELECT allergies FROM patient WHERE patient_id = ?
                    ");
                    $stmt->bind_param('i', $patient_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $patient_data = $result->fetch_assoc();

                    if ($patient_data && $patient_data['allergies'] == $item_id) {
                        // Clear the patient's allergy
                        $stmt2 = $mysqli->prepare("
                            UPDATE patient SET allergies = NULL WHERE patient_id = ?
                        ");
                        $stmt2->bind_param('i', $patient_id);
                        $stmt2->execute();
                        sendResponse(true, [], 'Allergy removed successfully');
                    } else {
                        sendResponse(false, [], 'Allergy not found for this patient', 404);
                    }
                    break;

                default:
                    sendResponse(false, [], 'Invalid medical record type for DELETE', 400);
            }
        } catch (Exception $e) {
            error_log("Medical records DELETE error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to delete medical record', 500);
        }
    }
}

// ==================== INSURANCE ====================
elseif ($endpoint === 'insurance') {
    $type = $_GET['type'] ?? '';

    if ($method === 'GET') {
        try {
            switch ($type) {
                case 'payers':
                    // Get all available insurance payers for dropdown
                    $stmt = $mysqli->prepare("
                        SELECT 
                            payer_id,
                            name,
                            payer_type
                        FROM insurance_payer
                        ORDER BY name ASC
                    ");
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $payers = $result->fetch_all(MYSQLI_ASSOC);
                    sendResponse(true, $payers);
                    break;

                default:
                    // Get patient's insurance policies
                    $stmt = $mysqli->prepare("
                        SELECT 
                            pi.id,
                            pi.member_id,
                            pi.group_id,
                            pi.effective_date,
                            pi.expiration_date,
                            pi.is_primary,
                            pi.plan_id,
                            ipl.copay,
                            ipl.deductible_individual,
                            ipl.coinsurance_rate,
                            ip.payer_id,
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
                    break;
            }
        } catch (Exception $e) {
            error_log("Insurance error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to load insurance', 500);
        }
    } elseif ($method === 'PUT') {
        // Update insurance policy
        $insurance_id = $_GET['id'] ?? null;
        if (!$insurance_id) {
            sendResponse(false, [], 'Insurance ID is required', 400);
        }

        $raw_input = file_get_contents('php://input');
        $input = json_decode($raw_input, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendResponse(false, [], 'Invalid JSON data: ' . json_last_error_msg(), 400);
        }

        try {
            $member_id = $input['member_id'] ?? '';
            $group_id = $input['group_id'] ?? '';
            $effective_date = $input['effective_date'] ?? null;
            $expiration_date = $input['expiration_date'] ?? null;
            $is_primary = isset($input['is_primary']) ? (int)$input['is_primary'] : 0;
            $payer_id = $input['payer_id'] ?? null;
            $plan_name = $input['plan_name'] ?? '';
            $plan_type = $input['plan_type'] ?? '';

            // Start transaction
            $mysqli->begin_transaction();

            $plan_id = null;

            // If payer_id and plan details are provided, find or create insurance plan
            if ($payer_id && ($plan_name || $plan_type)) {
                // Check if a plan with these details already exists
                $plan_check = $mysqli->prepare("
                    SELECT plan_id FROM insurance_plan 
                    WHERE payer_id = ? AND plan_name = ? AND plan_type = ?
                ");
                $plan_check->bind_param('iss', $payer_id, $plan_name, $plan_type);
                $plan_check->execute();
                $plan_result = $plan_check->get_result();

                if ($plan_row = $plan_result->fetch_assoc()) {
                    $plan_id = $plan_row['plan_id'];
                } else {
                    // Create new plan
                    $create_plan = $mysqli->prepare("
                        INSERT INTO insurance_plan (payer_id, plan_name, plan_type) 
                        VALUES (?, ?, ?)
                    ");
                    $create_plan->bind_param('iss', $payer_id, $plan_name, $plan_type);
                    if ($create_plan->execute()) {
                        $plan_id = $mysqli->insert_id;
                    }
                    $create_plan->close();
                }
                $plan_check->close();
            }

            // Build UPDATE query dynamically based on what fields are provided
            $update_fields = [];
            $update_values = [];
            $update_types = '';

            if ($member_id !== '') {
                $update_fields[] = 'member_id = ?';
                $update_values[] = $member_id;
                $update_types .= 's';
            }
            if ($group_id !== '') {
                $update_fields[] = 'group_id = ?';
                $update_values[] = $group_id;
                $update_types .= 's';
            }
            if ($effective_date) {
                $update_fields[] = 'effective_date = ?';
                $update_values[] = $effective_date;
                $update_types .= 's';
            }
            if ($expiration_date) {
                $update_fields[] = 'expiration_date = ?';
                $update_values[] = $expiration_date;
                $update_types .= 's';
            }
            if (isset($input['is_primary'])) {
                $update_fields[] = 'is_primary = ?';
                $update_values[] = $is_primary;
                $update_types .= 'i';
            }
            if ($plan_id) {
                $update_fields[] = 'plan_id = ?';
                $update_values[] = $plan_id;
                $update_types .= 'i';
            }

            if (empty($update_fields)) {
                $mysqli->rollback();
                sendResponse(false, [], 'No valid fields to update', 400);
                return;
            }

            // Add WHERE clause parameters
            $update_values[] = $insurance_id;
            $update_values[] = $patient_id;
            $update_types .= 'ii';

            $sql = "UPDATE patient_insurance SET " . implode(', ', $update_fields) . " WHERE id = ? AND patient_id = ?";
            $stmt = $mysqli->prepare($sql);

            if (!$stmt) {
                $mysqli->rollback();
                sendResponse(false, [], 'Database prepare failed: ' . $mysqli->error, 500);
                return;
            }

            $stmt->bind_param($update_types, ...$update_values);

            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    $mysqli->commit();
                    sendResponse(true, ['id' => $insurance_id], 'Insurance updated successfully');
                } else {
                    $mysqli->rollback();
                    sendResponse(false, [], 'Insurance policy not found or no changes made', 404);
                }
            } else {
                $mysqli->rollback();
                sendResponse(false, [], 'Failed to update insurance: ' . $stmt->error, 500);
            }

            $stmt->close();
        } catch (Exception $e) {
            error_log("Insurance update error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to update insurance', 500);
        }
    } elseif ($method === 'POST') {
        // Add new insurance policy
        error_log("Insurance POST: Starting add insurance process for patient_id: " . $patient_id);
        
        $raw_input = file_get_contents('php://input');
        error_log("Insurance POST: Raw input received: " . $raw_input);
        
        if (empty($raw_input)) {
            error_log("Insurance POST: No data provided");
            sendResponse(false, [], 'No data provided', 400);
            return;
        }

        $data = json_decode($raw_input, true);
        error_log("Insurance POST: Decoded data: " . json_encode($data));
        
        if (!$data) {
            error_log("Insurance POST: Invalid JSON data");
            sendResponse(false, [], 'Invalid JSON data', 400);
            return;
        }

        try {
            $mysqli->begin_transaction();

            // Check if patient already has insurance (enforce single policy restriction)
            $check_stmt = $mysqli->prepare("SELECT COUNT(*) as count FROM patient_insurance WHERE patient_id = ?");
            $check_stmt->bind_param('i', $patient_id);
            $check_stmt->execute();
            $check_result = $check_stmt->get_result();
            $existing_count = $check_result->fetch_assoc()['count'];
            $check_stmt->close();

            if ($existing_count > 0) {
                $mysqli->rollback();
                sendResponse(false, [], 'Patient already has an insurance policy. Only one policy is allowed.', 400);
                return;
            }

            $plan_id = null;

            // If payer_id and plan details are provided, find or create insurance plan
            if (isset($data['payer_id']) && isset($data['plan_name'])) {
                // Check if plan already exists
                $plan_stmt = $mysqli->prepare("
                    SELECT plan_id FROM insurance_plan 
                    WHERE payer_id = ? AND plan_name = ? AND plan_type = ?
                ");
                $plan_stmt->bind_param('iss', $data['payer_id'], $data['plan_name'], $data['plan_type']);
                $plan_stmt->execute();
                $plan_result = $plan_stmt->get_result();
                $existing_plan = $plan_result->fetch_assoc();
                $plan_stmt->close();

                if ($existing_plan) {
                    $plan_id = $existing_plan['plan_id'];
                } else {
                    // Create new plan
                    $new_plan_stmt = $mysqli->prepare("
                        INSERT INTO insurance_plan (payer_id, plan_name, plan_type) 
                        VALUES (?, ?, ?)
                    ");
                    $new_plan_stmt->bind_param('iss', $data['payer_id'], $data['plan_name'], $data['plan_type']);
                    
                    if (!$new_plan_stmt->execute()) {
                        $mysqli->rollback();
                        sendResponse(false, [], 'Failed to create insurance plan: ' . $new_plan_stmt->error, 500);
                        return;
                    }
                    
                    $plan_id = $mysqli->insert_id;
                    $new_plan_stmt->close();
                }
            } elseif (isset($data['plan_id'])) {
                $plan_id = $data['plan_id'];
            }

            // Insert patient insurance record
            $insert_fields = ['patient_id'];
            $insert_values = [$patient_id];
            $insert_types = 'i';

            if ($plan_id) {
                $insert_fields[] = 'plan_id';
                $insert_values[] = $plan_id;
                $insert_types .= 'i';
            }

            if (isset($data['member_id']) && !empty($data['member_id'])) {
                $insert_fields[] = 'member_id';
                $insert_values[] = $data['member_id'];
                $insert_types .= 's';
            }

            if (isset($data['group_id']) && !empty($data['group_id'])) {
                $insert_fields[] = 'group_id';
                $insert_values[] = $data['group_id'];
                $insert_types .= 's';
            }

            if (isset($data['effective_date']) && !empty($data['effective_date'])) {
                $insert_fields[] = 'effective_date';
                $insert_values[] = $data['effective_date'];
                $insert_types .= 's';
            }

            if (isset($data['expiration_date']) && !empty($data['expiration_date'])) {
                $insert_fields[] = 'expiration_date';
                $insert_values[] = $data['expiration_date'];
                $insert_types .= 's';
            }

            // Set as primary insurance (since we only allow one)
            $insert_fields[] = 'is_primary';
            $insert_values[] = 1;
            $insert_types .= 'i';

            $sql = "INSERT INTO patient_insurance (" . implode(', ', $insert_fields) . ") VALUES (" . str_repeat('?,', count($insert_fields) - 1) . "?)";
            
            $stmt = $mysqli->prepare($sql);
            if (!$stmt) {
                $mysqli->rollback();
                sendResponse(false, [], 'Database prepare failed: ' . $mysqli->error, 500);
                return;
            }

            $stmt->bind_param($insert_types, ...$insert_values);

            if ($stmt->execute()) {
                $new_insurance_id = $mysqli->insert_id;
                $mysqli->commit();
                error_log("Insurance POST: Successfully added insurance with ID: " . $new_insurance_id);
                sendResponse(true, ['id' => $new_insurance_id], 'Insurance added successfully');
            } else {
                $mysqli->rollback();
                error_log("Insurance POST: Failed to execute insert: " . $stmt->error);
                sendResponse(false, [], 'Failed to add insurance: ' . $stmt->error, 500);
            }

            $stmt->close();
        } catch (Exception $e) {
            error_log("Insurance add error: " . $e->getMessage());
            $mysqli->rollback();
            sendResponse(false, [], 'Failed to add insurance', 500);
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
                            COALESCE(SUM(COALESCE(copay_amount_due, 0) - COALESCE(payment, 0)), 0) as outstanding_balance,
                            COUNT(*) as visit_count
                        FROM patient_visit
                        WHERE patient_id = ?
                        AND COALESCE(copay_amount_due, 0) > 0
                        AND (COALESCE(copay_amount_due, 0) - COALESCE(payment, 0)) > 0
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
                            CONCAT('Appointment with Dr. ', doc_staff.last_name, ' on ', DATE_FORMAT(v.date, '%M %d, %Y')) as service,
                            COALESCE(v.copay_amount_due, 0) as amount,
                            (COALESCE(v.copay_amount_due, 0) - COALESCE(v.payment, 0)) as balance,
                            CASE 
                                WHEN (COALESCE(v.copay_amount_due, 0) - COALESCE(v.payment, 0)) <= 0 THEN 'Paid'
                                WHEN v.payment > 0 THEN 'Partial payment'
                                ELSE 'Unpaid'
                            END as status,
                            v.payment
                        FROM patient_visit v
                        LEFT JOIN doctor d ON v.doctor_id = d.doctor_id
                        LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
                        WHERE v.patient_id = ?
                        AND COALESCE(v.copay_amount_due, 0) > 0
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
            error_log("=== PAYMENT DEBUG ===");
            error_log("Payment request - Session ID: " . session_id());
            error_log("Payment request - Session data: " . json_encode($_SESSION));
            error_log("Payment request - Patient ID: " . ($patient_id ?? 'NULL'));

            // Process a payment for a visit
            $input = json_decode(file_get_contents('php://input'), true);
            error_log("Payment request - Input data: " . json_encode($input));
            $visit_id = isset($input['visit_id']) ? (int) $input['visit_id'] : null;
            $amount = isset($input['amount']) ? floatval($input['amount']) : 0;

            if ($amount <= 0) {
                sendResponse(false, [], 'Invalid payment amount', 400);
            }

            if ($visit_id) {
                $stmt = $mysqli->prepare("SELECT copay_amount_due, payment FROM patient_visit WHERE visit_id = ? AND patient_id = ? LIMIT 1");
                $stmt->bind_param('ii', $visit_id, $patient_id);
                $stmt->execute();
                $res = $stmt->get_result();
                $row = $res->fetch_assoc();
                if (!$row) {
                    sendResponse(false, [], 'Visit not found', 404);
                }

                $currentpayment = floatval($row['payment'] ?? 0);
                $currentDue = floatval($row['copay_amount_due'] ?? 0);
                $newpayment = $currentpayment + $amount;
                $newDue = max(0, $currentDue - $amount);

                // Update payment field only - the due amounts remain the same as they represent the original charges
                $stmt = $mysqli->prepare("UPDATE patient_visit SET payment = ? WHERE visit_id = ? AND patient_id = ?");
                $stmt->bind_param('dii', $newpayment, $visit_id, $patient_id);
                $stmt->execute();

                sendResponse(true, ['visit_id' => $visit_id, 'paid' => $amount, 'new_balance' => $newDue], 'payment processed');
            } else {
                // No visit specified: apply as credit (not implemented fully).
                sendResponse(false, [], 'Visit id required for payment', 400);
            }
        } catch (Exception $e) {
            error_log('payment error: ' . $e->getMessage());
            sendResponse(false, [], 'Failed to process payment', 500);
        }
    }
}

// ==================== REFERRALS ====================
elseif ($endpoint === 'referrals') {
    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'active';

        if ($action === 'active') {
            // Get active and used referrals (90-day expiration from date_of_approval)
            try {
                $stmt = $mysqli->prepare("
                    SELECT 
                        r.referral_id,
                        r.patient_id,
                        r.date_of_approval,
                        DATE_ADD(r.date_of_approval, INTERVAL 90 DAY) as expiration_date,
                        r.reason,
                        r.specialist_doctor_staff_id as specialist_id,
                        CONCAT(s.first_name, ' ', s.last_name) as specialist_name,
                        sp.specialty_name,
                        r.appointment_id,
                        CONCAT(ref_s.first_name, ' ', ref_s.last_name) as referring_doctor_name,
                        DATEDIFF(DATE_ADD(r.date_of_approval, INTERVAL 90 DAY), CURDATE()) as days_remaining,
                        CASE 
                            WHEN DATEDIFF(DATE_ADD(r.date_of_approval, INTERVAL 90 DAY), CURDATE()) <= 7 THEN 'urgent'
                            WHEN DATEDIFF(DATE_ADD(r.date_of_approval, INTERVAL 90 DAY), CURDATE()) <= 30 THEN 'warning'
                            ELSE 'normal'
                        END as urgency_level
                    FROM referral r
                    LEFT JOIN doctor d ON r.specialist_doctor_staff_id = d.doctor_id
                    LEFT JOIN staff s ON d.staff_id = s.staff_id
                    LEFT JOIN specialty sp ON d.specialty = sp.specialty_id
                    LEFT JOIN doctor ref_d ON r.referring_doctor_staff_id = ref_d.doctor_id
                    LEFT JOIN staff ref_s ON ref_d.staff_id = ref_s.staff_id
                    WHERE r.patient_id = ?
                    AND r.date_of_approval IS NOT NULL
                    AND DATE_ADD(r.date_of_approval, INTERVAL 90 DAY) >= CURDATE()
                    ORDER BY 
                        CASE WHEN r.appointment_id IS NULL THEN 0 ELSE 1 END,
                        CASE 
                            WHEN DATEDIFF(DATE_ADD(r.date_of_approval, INTERVAL 90 DAY), CURDATE()) <= 7 THEN 0
                            WHEN DATEDIFF(DATE_ADD(r.date_of_approval, INTERVAL 90 DAY), CURDATE()) <= 30 THEN 1
                            ELSE 2
                        END,
                        DATE_ADD(r.date_of_approval, INTERVAL 90 DAY) ASC
                ");

                $stmt->bind_param('i', $patient_id);
                $stmt->execute();
                $result = $stmt->get_result();
                $referrals = $result->fetch_all(MYSQLI_ASSOC);

                // Categorize referrals
                $active = [];
                $used = [];

                foreach ($referrals as $ref) {
                    $formatted = [
                        'referral_id' => $ref['referral_id'],
                        'specialist_id' => $ref['specialist_id'],
                        'specialist_name' => $ref['specialist_name'] ?? 'Unknown Specialist',
                        'specialty_name' => $ref['specialty_name'] ?? 'Specialist',
                        'referring_doctor' => $ref['referring_doctor_name'] ?? 'Unknown Doctor',
                        'reason' => $ref['reason'] ?? 'No reason provided',
                        'date_issued' => $ref['date_of_approval'],
                        'expiration_date' => $ref['expiration_date'],
                        'days_remaining' => (int)$ref['days_remaining'],
                        'urgency_level' => $ref['urgency_level'],
                        'is_used' => $ref['appointment_id'] !== null,
                        'appointment_id' => $ref['appointment_id']
                    ];

                    if ($ref['appointment_id'] === null) {
                        $active[] = $formatted;
                    } else {
                        $used[] = $formatted;
                    }
                }
                sendResponse(true, [
                    'active' => $active,
                    'used' => $used,
                    'active_count' => count($active),
                    'used_count' => count($used)
                ], 'Referrals retrieved successfully');
            } catch (Exception $e) {
                error_log("Referrals error: " . $e->getMessage());
                sendResponse(false, [], 'Failed to load referrals: ' . $e->getMessage(), 500);
            }
        }
    }
}

// ==================== SCHEDULE ====================
elseif ($endpoint === 'schedule') {
    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'availability';

        if ($action === 'availability') {
            // Get doctor's available offices based on work schedule
            $doctor_id = isset($_GET['doctor_id']) ? intval($_GET['doctor_id']) : 0;
            $date = $_GET['date'] ?? null;

            if ($doctor_id === 0) {
                sendResponse(false, [], 'doctor_id required', 400);
            }

            try {
                // If date provided, get offices for that specific day
                if ($date) {
                    // Validate date format
                    $datetime = DateTime::createFromFormat('Y-m-d', $date);
                    if (!$datetime) {
                        sendResponse(false, [], 'Invalid date format. Use YYYY-MM-DD', 400);
                        return;
                    }

                    $day_of_week = $datetime->format('l'); // Monday, Tuesday, etc.

                    $stmt = $mysqli->prepare("
                        SELECT DISTINCT
                            o.office_id,
                            o.name as office_name,
                            CONCAT(o.address, ', ', o.city, ', ', o.state, ' ', o.zipcode) as full_address,
                            o.phone,
                            ws.start_time,
                            ws.end_time
                        FROM work_schedule ws
                        JOIN office o ON ws.office_id = o.office_id
                        JOIN doctor d ON ws.staff_id = d.staff_id
                        WHERE d.doctor_id = ?
                        AND (
                            (ws.days = ? AND ws.days IS NOT NULL)
                            OR (ws.day_of_week = ? AND ws.days IS NULL)
                        )
                        ORDER BY o.name
                    ");

                    $stmt->bind_param('iss', $doctor_id, $date, $day_of_week);
                } else {
                    // Get all offices where doctor works (any day)
                    $stmt = $mysqli->prepare("
                        SELECT DISTINCT
                            o.office_id,
                            o.name as office_name,
                            CONCAT(o.address, ', ', o.city, ', ', o.state, ' ', o.zipcode) as full_address,
                            o.phone
                        FROM work_schedule ws
                        JOIN office o ON ws.office_id = o.office_id
                        JOIN doctor d ON ws.staff_id = d.staff_id
                        WHERE d.doctor_id = ?
                        ORDER BY o.name
                    ");

                    $stmt->bind_param('i', $doctor_id);
                }

                $stmt->execute();
                $result = $stmt->get_result();
                $schedules = $result->fetch_all(MYSQLI_ASSOC);

                sendResponse(true, [
                    'offices' => $schedules,
                    'count' => count($schedules),
                    'date_filtered' => $date !== null,
                    'selected_date' => $date
                ], 'Schedule retrieved successfully');
            } catch (Exception $e) {
                error_log("Schedule error: " . $e->getMessage());
                sendResponse(false, [], 'Failed to load schedule: ' . $e->getMessage(), 500);
            }
        } elseif ($action === 'timeslots') {
            // Get available time slots for a doctor on a specific date
            $doctor_id = isset($_GET['doctor_id']) ? intval($_GET['doctor_id']) : 0;
            $date = $_GET['date'] ?? null;

            if ($doctor_id === 0 || !$date) {
                sendResponse(false, [], 'doctor_id and date required', 400);
            }

            try {
                // Validate date format
                $datetime = DateTime::createFromFormat('Y-m-d', $date);
                if (!$datetime) {
                    sendResponse(false, [], 'Invalid date format. Use YYYY-MM-DD', 400);
                    return;
                }

                $day_of_week = $datetime->format('l'); // Monday, Tuesday, etc.

                // First check if doctor works on this day
                error_log("=== TIMESLOTS DEBUG ===");
                error_log("Doctor ID: $doctor_id");
                error_log("Date: $date");
                error_log("Day of week: $day_of_week");

                $stmt = $mysqli->prepare("
                    SELECT COUNT(*) as schedule_count, 
                           MIN(ws.start_time) as earliest_start,
                           MAX(ws.end_time) as latest_end,
                           GROUP_CONCAT(CONCAT(ws.day_of_week, ' at office ', ws.office_id)) as schedule_details,
                           d.staff_id
                    FROM work_schedule ws
                    JOIN doctor d ON ws.staff_id = d.staff_id
                    WHERE d.doctor_id = ?
                    AND (
                        (ws.days = ? AND ws.days IS NOT NULL)
                        OR (ws.day_of_week = ? AND ws.days IS NULL)
                    )
                    GROUP BY d.staff_id
                ");

                $stmt->bind_param('iss', $doctor_id, $date, $day_of_week);
                $stmt->execute();
                $result = $stmt->get_result();
                $schedule_check = $result->fetch_assoc();

                error_log("Schedule check result: " . json_encode($schedule_check));

                if (!$schedule_check || $schedule_check['schedule_count'] == 0) {
                    // Let's also check what schedules exist for this doctor on any day
                    $debug_stmt = $mysqli->prepare("
                        SELECT ws.day_of_week, ws.office_id, ws.start_time, ws.end_time, d.staff_id
                        FROM work_schedule ws
                        JOIN doctor d ON ws.staff_id = d.staff_id
                        WHERE d.doctor_id = ?
                    ");
                    $debug_stmt->bind_param('i', $doctor_id);
                    $debug_stmt->execute();
                    $debug_result = $debug_stmt->get_result();
                    $all_schedules = $debug_result->fetch_all(MYSQLI_ASSOC);

                    error_log("All schedules for doctor $doctor_id: " . json_encode($all_schedules));

                    sendResponse(true, [
                        'available_slots' => [],
                        'booked_slots' => [],
                        'date' => $date,
                        'doctor_id' => $doctor_id,
                        'day_of_week' => $day_of_week,
                        'debug_all_schedules' => $all_schedules,
                        'message' => 'Doctor is not scheduled to work on this date'
                    ], 'No available time slots for this date');
                    return;
                }

                // Define standard time slots (business hours 8 AM - 6 PM)
                $all_time_slots = [
                    '8:00 AM',
                    '9:00 AM',
                    '10:00 AM',
                    '11:00 AM',
                    '1:00 PM',
                    '2:00 PM',
                    '3:00 PM',
                    '4:00 PM',
                    '5:00 PM'
                ];

                // Convert to 24-hour format for database comparison
                $time_slot_mapping = [
                    '8:00 AM' => '08:00:00',
                    '9:00 AM' => '09:00:00',
                    '10:00 AM' => '10:00:00',
                    '11:00 AM' => '11:00:00',
                    '1:00 PM' => '13:00:00',
                    '2:00 PM' => '14:00:00',
                    '3:00 PM' => '15:00:00',
                    '4:00 PM' => '16:00:00',
                    '5:00 PM' => '17:00:00'
                ];

                // Get existing appointments for this doctor on this date
                $stmt = $mysqli->prepare("
                    SELECT TIME(appointment_date) as appointment_time
                    FROM appointment 
                    WHERE doctor_id = ? 
                    AND DATE(appointment_date) = ?
                    AND status != 'Cancelled'
                ");

                $stmt->bind_param('is', $doctor_id, $date);
                $stmt->execute();
                $result = $stmt->get_result();

                $booked_times = [];
                while ($row = $result->fetch_assoc()) {
                    $booked_times[] = $row['appointment_time'];
                }

                // Filter out booked time slots
                $available_slots = [];
                foreach ($all_time_slots as $slot) {
                    $slot_time = $time_slot_mapping[$slot];
                    if (!in_array($slot_time, $booked_times)) {
                        $available_slots[] = $slot;
                    }
                }

                sendResponse(true, [
                    'available_slots' => $available_slots,
                    'booked_slots' => array_keys(array_filter($time_slot_mapping, function ($time) use ($booked_times) {
                        return in_array($time, $booked_times);
                    })),
                    'date' => $date,
                    'doctor_id' => $doctor_id,
                    'schedule_info' => $schedule_check
                ], 'Available time slots retrieved successfully');
            } catch (Exception $e) {
                error_log("Time slots error: " . $e->getMessage());
                sendResponse(false, [], 'Failed to load time slots: ' . $e->getMessage(), 500);
            }
        }
    }
}

// Invalid endpoint
else {
    sendResponse(false, [], 'Invalid endpoint', 404);
}

$mysqli->close();
