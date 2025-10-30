<?php
// patient_api.php - Patient Portal API Endpoints (cleaned and fixed)

require_once 'helpers.php';
require_once '../database.php';

header('Content-Type: application/json');

// Use SSL-enabled database connection for Azure MySQL
try {
    $mysqli = getDBConnection();
} catch (Exception $e) {
    error_log('Database connection failed: ' . $e->getMessage());
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
        } else {
            error_log('Patient lookup prepare failed: ' . $mysqli->error);
        }
    }
}

if (!$patient_id) {
    error_log("Patient API: No patient_id found. Session data: " . print_r($_SESSION, true));
    sendResponse(false, [], 'Patient ID not found for authenticated user', 400);
}

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = $_GET['endpoint'] ?? '';

// Simple test endpoint
if ($endpoint === 'test') {
    sendResponse(true, ['message' => 'Patient API is working', 'timestamp' => date('Y-m-d H:i:s')]);
}

error_log("Patient API: Method=$method, Endpoint=$endpoint, Patient_ID=$patient_id");

// ==================== DASHBOARD ====================
if ($endpoint === 'dashboard') {
    error_log("Dashboard: Entering dashboard endpoint");
    if ($method === 'GET') {
        try {
            error_log("Dashboard: Starting dashboard query for patient_id: " . $patient_id);
            
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
                error_log("Dashboard: Failed to prepare appointments query: " . $mysqli->error);
                sendResponse(false, [], 'Failed to prepare appointments query: ' . $mysqli->error, 500);
                return;
            }
            
            $stmt->bind_param('i', $patient_id);
            if (!$stmt->execute()) {
                error_log("Dashboard: Failed to execute appointments query: " . $stmt->error);
                sendResponse(false, [], 'Failed to execute appointments query: ' . $stmt->error, 500);
                return;
            }
            
            $result = $stmt->get_result();
            $upcoming_appointments = $result->fetch_all(MYSQLI_ASSOC);
            error_log("Dashboard: Found " . count($upcoming_appointments) . " upcoming appointments");
            
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
            error_log("Dashboard error: " . $e->getMessage());
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
        $input = json_decode(file_get_contents('php://input'), true);
        
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
            // Use NULLIF so empty strings are stored as SQL NULL
            $stmt = $mysqli->prepare(
                "UPDATE patient
                SET first_name = NULLIF(?, ''),
                    last_name = NULLIF(?, ''),
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
                error_log('Profile update prepare failed: ' . $mysqli->error);
                sendResponse(false, [], 'Database prepare failed: ' . $mysqli->error, 500);
            }
            // Expecting keys: first_name, last_name, email, dob (YYYY-MM-DD),
            // gender, genderAtBirth, ethnicity, race, primary_doctor
            $first = $input['first_name'] ?? '';
            $last = $input['last_name'] ?? '';
            $email = $input['email'] ?? '';
            $dob = $input['dob'] ?? '';
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
                error_log('Profile update execute failed: ' . $stmt->error);
                sendResponse(false, [], 'Database execute failed: ' . $stmt->error, 500);
            }

            sendResponse(true, [], 'Profile updated successfully');
            
        } catch (Exception $e) {
            // Log the full exception and return the message to the client for easier debugging in dev
            error_log("Profile update error: " . $e->getMessage());
            error_log($e);
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
    $input = json_decode(file_get_contents('php://input'), true);
    
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
        $result = $mysqli->query("SELECT COALESCE(MAX(appointment_id), 0) + 1 as next_id FROM appointment");
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
        
        // Insert appointment with explicit status for PCP appointments
        $stmt = $mysqli->prepare("
            INSERT INTO appointment (
                appointment_id, patient_id, doctor_id, office_id, 
                appointment_date, date_created, reason_for_visit, status
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
        
        if (!$exec_result) {
            $error_msg = $stmt->error;
            $mysqli->rollback();
            
            // Check for trigger validation errors
            if (strpos($error_msg, 'Cannot create appointment in the past') !== false) {
                sendResponse(false, [], 'Cannot schedule an appointment in the past. Please select a future date and time.', 400);
            } elseif (strpos($error_msg, 'Cannot schedule appointment more than 1 year in advance') !== false) {
                sendResponse(false, [], 'Cannot schedule appointments more than 1 year in advance.', 400);
            } elseif (strpos($error_msg, 'Appointments must be scheduled between') !== false) {
                sendResponse(false, [], 'Appointments must be scheduled during business hours (8 AM - 6 PM).', 400);
            } elseif (strpos($error_msg, 'cannot be scheduled on weekends') !== false) {
                sendResponse(false, [], 'Appointments cannot be scheduled on weekends. Please select a weekday.', 400);
            } elseif (strpos($error_msg, 'This time slot is already booked') !== false) {
                sendResponse(false, [], 'This time slot is already booked. Please select a different time.', 400);
            } elseif (strpos($error_msg, 'must have a referral') !== false) {
                sendResponse(false, [], 'You must have a referral to book an appointment with a specialist. Please contact your primary care physician.', 400);
            } elseif (strpos($error_msg, 'You must select your Primary Care Physician') !== false) {
                sendResponse(false, [], 'You can only book appointments with your Primary Care Physician. To see other doctors, please get a referral from your PCP first.', 400);
            } elseif (strpos($error_msg, 'must select your Primary Care Physician') !== false) {
                sendResponse(false, [], 'You can only book appointments with your Primary Care Physician. To see other doctors, please get a referral from your PCP first.', 400);
            } else {
                // Generic error
                error_log("Book appointment error: " . $error_msg);
                sendResponse(false, [], 'Failed to book appointment. Please try again.', 500);
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
        } else {
            sendResponse(false, [], $error_msg, 400);
        }
    } else {
        sendResponse(false, [], 'Failed to book appointment. Please try again.', 500);
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
                error_log("Offices query failed: " . $mysqli->error);
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

// ==================== MEDICAL RECORDS ====================
elseif ($endpoint === 'medical-records') {
    $type = $_GET['type'] ?? '';
    
    if ($method === 'GET') {
        try {
            switch ($type) {
                case 'vitals':
                    $stmt = $mysqli->prepare("                        SELECT 
                            DATE(date) as date,
                            blood_pressure as bp,
                            temperature as temp
                        FROM patient_visit
                        WHERE patient_id = ?
                        AND blood_pressure IS NOT NULL
                        ORDER BY date DESC
                        LIMIT 10
                    ");
                    $stmt->bind_param('i', $patient_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $vitals = $result->fetch_all(MYSQLI_ASSOC);
                    sendResponse(true, $vitals);
                    break;
                    
                case 'medications':
                    $stmt = $mysqli->prepare("
                        SELECT 
                            p.medication_name as name,
                            CONCAT(p.dosage, ' - ', p.frequency) as frequency,
                            CONCAT(d.first_name, ' ', d.last_name) as prescribed_by,
                            p.start_date,
                            p.end_date
                        FROM prescription p
                        LEFT JOIN doctor d ON p.doctor_id = d.doctor_id
                        WHERE p.patient_id = ?
                        AND (p.end_date IS NULL OR p.end_date >= CURDATE())
                        ORDER BY p.start_date DESC
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
                    
                case 'conditions':
                    $stmt = $mysqli->prepare("                        SELECT 
                            condition_name as name,
                            diagnosis_date
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
                    $stmt = $mysqli->prepare("                        SELECT 
                            v.visit_id,
                            v.date,
                            v.reason_for_visit,
                            CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                            v.diagnosis,
                            v.treatment,
                            v.blood_pressure,
                            v.temperature
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
                    $stmt = $mysqli->prepare("                        SELECT 
                            COALESCE(SUM(total_due), 0) as outstanding_balance
                        FROM patient_visit
                        WHERE patient_id = ?
                        AND total_due > 0
                    ");
                    $stmt->bind_param('i', $patient_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $balance = $result->fetch_assoc();
                    sendResponse(true, $balance);
                    break;
                    
                case 'statements':
                    $stmt = $mysqli->prepare("                        SELECT 
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
                    sendResponse(true, $statements);
                    break;
                    
                case 'POST':
                    // Process a payment for a visit
                    $input = json_decode(file_get_contents('php://input'), true);
                    $visit_id = isset($input['visit_id']) ? (int)$input['visit_id'] : null;
                    $amount = isset($input['amount']) ? floatval($input['amount']) : 0;

                    if ($amount <= 0) {
                        sendResponse(false, [], 'Invalid payment amount', 400);
                    }

                    try {
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
                    }
                    
                default:
                    sendResponse(false, [], 'Invalid billing type', 400);
            }
            
        } catch (Exception $e) {
            error_log("Billing error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to load billing information', 500);
        }
    }
}

// Invalid endpoint
else {
    sendResponse(false, [], 'Invalid endpoint', 404);
}

$mysqli->close();
?>