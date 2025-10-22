<?php
// patient_api.php - Patient Portal API Endpoints (FIXED for MySQLi)

require_once 'helpers.php';

header('Content-Type: application/json');

// Database connection
$host = getenv('DB_HOST') ?: 'localhost';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASSWORD') ?: '';
$name = getenv('DB_NAME') ?: 'med-app-db';
$port = (int)(getenv('DB_PORT') ?: 3306);

$mysqli = new mysqli($host, $user, $pass, $name, $port);

if ($mysqli->connect_error) {
    sendResponse(false, [], 'Database connection failed: ' . $mysqli->connect_error, 500);
}

// Require authentication (currently mocked)
requireAuth(['PATIENT']);

// Get patient_id from session (set by mock auth)
$patient_id = $_SESSION['patient_id'] ?? null;

if (!$patient_id) {
    sendResponse(false, [], 'Patient ID not found', 400);
}

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = $_GET['endpoint'] ?? '';

// ==================== DASHBOARD ====================
if ($endpoint === 'dashboard') {
    if ($method === 'GET') {
        try {
            // Get upcoming appointments
            $stmt = $mysqli->prepare("
                SELECT 
                    a.Appointment_id,
                    a.Appointment_date,
                    a.Reason_for_visit,
                    CONCAT(d.First_Name, ' ', d.Last_Name) as doctor_name,
                    s.specialty_name,
                    o.Name as office_name,
                    CONCAT(o.BuildingNo, ', ', o.City, ', ', o.State, ' ', o.ZipCode) as office_address,
                    'Confirmed' as status
                FROM Appointment a
                LEFT JOIN Doctor d ON a.Doctor_id = d.Doctor_id
                LEFT JOIN Specialty s ON d.Specialty = s.specialty_id
                LEFT JOIN Office o ON a.Office_id = o.Office_ID
                WHERE a.Patient_id = ? 
                AND a.Appointment_date >= NOW()
                ORDER BY a.Appointment_date ASC
            ");
            $stmt->bind_param('i', $patient_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $upcoming_appointments = $result->fetch_all(MYSQLI_ASSOC);
            
            // Get PCP info
            $stmt = $mysqli->prepare("
                SELECT 
                    d.Doctor_id,
                    CONCAT(d.First_Name, ' ', d.Last_Name) as name,
                    s.specialty_name,
                    o.Name as office_name,
                    d.Phone,
                    d.Email,
                    CONCAT(o.BuildingNo, ', ', o.City, ', ', o.State) as location
                FROM Patient p
                LEFT JOIN Doctor d ON p.Primary_Doctor = d.Doctor_id
                LEFT JOIN Specialty s ON d.Specialty = s.specialty_id
                LEFT JOIN Office o ON d.Work_Location = o.Office_ID
                WHERE p.Patient_ID = ?
            ");
            $stmt->bind_param('i', $patient_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $pcp = $result->fetch_assoc();
            
            // Get recent activity (last 3 visits)
            $stmt = $mysqli->prepare("
                SELECT 
                    v.Visit_id,
                    v.Date,
                    CONCAT(d.First_Name, ' ', d.Last_Name) as doctor_name,
                    v.Status,
                    v.TotalDue
                FROM PatientVisit v
                LEFT JOIN Doctor d ON v.Doctor_id = d.Doctor_id
                WHERE v.Patient_id = ?
                ORDER BY v.Date DESC
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
            $stmt = $mysqli->prepare("
                SELECT 
                    p.Patient_ID,
                    p.First_Name,
                    p.Last_Name,
                    p.dob,
                    p.Email,
                    p.EmergencyContact,
                    p.AssignedAtBirth_Gender,
                    p.Gender,
                    p.Ethnicity,
                    p.Race,
                    p.BloodType,
                    CONCAT(d.First_Name, ' ', d.Last_Name) as pcp_name,
                    d.Doctor_id as pcp_id,
                    s.specialty_name as pcp_specialty,
                    o.Name as pcp_office,
                    d.Phone as pcp_phone,
                    d.Email as pcp_email,
                    CONCAT(o.BuildingNo, ', ', o.City, ', ', o.State) as pcp_location
                FROM Patient p
                LEFT JOIN Doctor d ON p.Primary_Doctor = d.Doctor_id
                LEFT JOIN Specialty s ON d.Specialty = s.specialty_id
                LEFT JOIN Office o ON d.Work_Location = o.Office_ID
                WHERE p.Patient_ID = ?
            ");
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
            $stmt = $mysqli->prepare("
                UPDATE Patient 
                SET First_Name = ?,
                    Last_Name = ?,
                    Email = ?,
                    EmergencyContact = ?
                WHERE Patient_ID = ?
            ");
            $stmt->bind_param('ssssi', 
                $input['first_name'],
                $input['last_name'],
                $input['email'],
                $input['emergency_contact'],
                $patient_id
            );
            $stmt->execute();
            
            sendResponse(true, [], 'Profile updated successfully');
            
        } catch (Exception $e) {
            error_log("Profile update error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to update profile', 500);
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
                        a.Appointment_id,
                        a.Appointment_date,
                        a.Reason_for_visit,
                        CONCAT(d.First_Name, ' ', d.Last_Name) as doctor_name,
                        s.specialty_name,
                        o.Name as office_name,
                        o.Phone as office_phone,
                        CONCAT(o.BuildingNo, ', ', o.City, ', ', o.State, ' ', o.ZipCode) as office_address,
                        'Confirmed' as status
                    FROM Appointment a
                    LEFT JOIN Doctor d ON a.Doctor_id = d.Doctor_id
                    LEFT JOIN Specialty s ON d.Specialty = s.specialty_id
                    LEFT JOIN Office o ON a.Office_id = o.Office_ID
                    WHERE a.Patient_id = ? 
                    AND a.Appointment_date >= NOW()
                    ORDER BY a.Appointment_date ASC
                ");
                $stmt->bind_param('i', $patient_id);
            } else {
                // History
                $stmt = $mysqli->prepare("
                    SELECT 
                        v.Visit_id,
                        v.Date,
                        v.Reason_for_Visit,
                        CONCAT(d.First_Name, ' ', d.Last_Name) as doctor_name,
                        v.Status,
                        v.Diagnosis,
                        v.Treatment
                    FROM PatientVisit v
                    LEFT JOIN Doctor d ON v.Doctor_id = d.Doctor_id
                    WHERE v.Patient_id = ?
                    AND v.Status = 'Completed'
                    ORDER BY v.Date DESC
                ");
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
            
            // Generate appointment ID
            $result = $mysqli->query("SELECT COALESCE(MAX(Appointment_id), 0) + 1 as next_id FROM Appointment");
            $row = $result->fetch_assoc();
            $next_id = $row['next_id'];
            
            $stmt = $mysqli->prepare("
                INSERT INTO Appointment (
                    Appointment_id, Patient_id, Doctor_id, Office_id, 
                    Appointment_date, Date_created, Reason_for_visit
                ) VALUES (?, ?, ?, ?, ?, NOW(), ?)
            ");
            $stmt->bind_param('iiiiss',
                $next_id,
                $patient_id,
                $input['doctor_id'],
                $input['office_id'],
                $input['appointment_date'],
                $input['reason']
            );
            $stmt->execute();
            
            // If referral is needed, create referral record
            if (isset($input['needs_referral']) && $input['needs_referral']) {
                $stmt = $mysqli->prepare("
                    INSERT INTO Referral (
                        Patient_ID, appointment_id, Reason, Status
                    ) VALUES (?, ?, ?, 'Pending')
                ");
                $stmt->bind_param('iis',
                    $patient_id,
                    $next_id,
                    $input['reason']
                );
                $stmt->execute();
            }
            
            $mysqli->commit();
            sendResponse(true, ['appointment_id' => $next_id], 'Appointment booked successfully');
            
        } catch (Exception $e) {
            $mysqli->rollback();
            error_log("Book appointment error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to book appointment', 500);
        }
    }
    elseif ($method === 'DELETE') {
        // Cancel appointment
        $appointment_id = $_GET['id'] ?? null;
        
        if (!$appointment_id) {
            sendResponse(false, [], 'Appointment ID required', 400);
        }
        
        try {
            $stmt = $mysqli->prepare("
                DELETE FROM Appointment 
                WHERE Appointment_id = ? 
                AND Patient_id = ?
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
            $result = $mysqli->query("
                SELECT 
                    d.Doctor_id,
                    CONCAT(d.First_Name, ' ', d.Last_Name) as name,
                    s.specialty_name,
                    o.Name as office_name,
                    CONCAT(o.BuildingNo, ', ', o.City, ', ', o.State) as location
                FROM Doctor d
                LEFT JOIN Specialty s ON d.Specialty = s.specialty_id
                LEFT JOIN Office o ON d.Work_Location = o.Office_ID
                ORDER BY d.Last_Name, d.First_Name
            ");
            
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
                    Office_ID,
                    Name,
                    CONCAT(BuildingNo, ', ', City, ', ', State, ' ', ZipCode) as address,
                    Phone
                FROM Office
                ORDER BY Name
            ");
            
            $offices = $result->fetch_all(MYSQLI_ASSOC);
            sendResponse(true, $offices);
            
        } catch (Exception $e) {
            error_log("Offices error: " . $e->getMessage());
            sendResponse(false, [], 'Failed to load offices', 500);
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
                    $stmt = $mysqli->prepare("
                        SELECT 
                            DATE(Date) as date,
                            Blood_pressure as bp,
                            Temperature as temp
                        FROM PatientVisit
                        WHERE Patient_id = ?
                        AND Blood_pressure IS NOT NULL
                        ORDER BY Date DESC
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
                            CONCAT(d.First_Name, ' ', d.Last_Name) as prescribed_by,
                            p.start_date,
                            p.end_date
                        FROM Prescription p
                        LEFT JOIN Doctor d ON p.doctor_id = d.Doctor_id
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
                        SELECT ca.Allergies_Text as allergy
                        FROM Patient p
                        LEFT JOIN CodesAllergies ca ON p.Allergies = ca.AllergiesCode
                        WHERE p.Patient_ID = ?
                    ");
                    $stmt->bind_param('i', $patient_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $allergy = $result->fetch_assoc();
                    $allergies = $allergy && $allergy['allergy'] ? [$allergy['allergy']] : [];
                    sendResponse(true, $allergies);
                    break;
                    
                case 'conditions':
                    $stmt = $mysqli->prepare("
                        SELECT 
                            Condition_name as name,
                            Diagnosis_date
                        FROM MedicalCondition
                        WHERE Patient_id = ?
                        ORDER BY Diagnosis_date DESC
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
                            v.Visit_id,
                            v.Date,
                            v.Reason_for_Visit,
                            CONCAT(d.First_Name, ' ', d.Last_Name) as doctor_name,
                            v.Diagnosis,
                            v.Treatment,
                            v.Blood_pressure,
                            v.Temperature
                        FROM PatientVisit v
                        LEFT JOIN Doctor d ON v.Doctor_id = d.Doctor_id
                        WHERE v.Patient_id = ?
                        AND v.Status = 'Completed'
                        ORDER BY v.Date DESC
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
            $stmt = $mysqli->prepare("
                SELECT 
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
                    $stmt = $mysqli->prepare("
                        SELECT 
                            COALESCE(SUM(TotalDue), 0) as outstanding_balance
                        FROM PatientVisit
                        WHERE Patient_id = ?
                        AND TotalDue > 0
                    ");
                    $stmt->bind_param('i', $patient_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $balance = $result->fetch_assoc();
                    sendResponse(true, $balance);
                    break;
                    
                case 'statements':
                    $stmt = $mysqli->prepare("
                        SELECT 
                            v.Visit_id as id,
                            DATE(v.Date) as date,
                            v.Reason_for_Visit as service,
                            v.AmountDue as amount,
                            v.TotalDue as balance,
                            CASE 
                                WHEN v.TotalDue = 0 THEN 'Paid'
                                WHEN v.Payment > 0 THEN 'Partial Payment'
                                ELSE 'Unpaid'
                            END as status,
                            v.Payment
                        FROM PatientVisit v
                        WHERE v.Patient_id = ?
                        AND v.AmountDue IS NOT NULL
                        ORDER BY v.Date DESC
                        LIMIT 50
                    ");
                    $stmt->bind_param('i', $patient_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $statements = $result->fetch_all(MYSQLI_ASSOC);
                    sendResponse(true, $statements);
                    break;
                    
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