<?php
// signup.php
header('Content-Type: application/json');

// Database configuration
$host = getenv('AZURE_MYSQL_HOST') ?: '';
$user = getenv('AZURE_MYSQL_USERNAME') ?: '';
$pass = getenv('AZURE_MYSQL_PASSWORD') ?: '';
$db   = getenv('AZURE_MYSQL_DBNAME') ?: '';
$port = getenv('AZURE_MYSQL_PORT') ?: '3306';

// Initialize response array
$response = [
    'success' => false,
    'message' => '',
    'errors' => []
];

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Invalid request method';
    echo json_encode($response);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required_fields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'dateOfBirth', 'phone', 'gender'];
foreach ($required_fields as $field) {
    if (empty($input[$field])) {
        $response['errors'][$field] = ucfirst(str_replace('_', ' ', $field)) . ' is required';
    }
}

// If there are validation errors, return them
if (!empty($response['errors'])) {
    $response['message'] = 'Please fill in all required fields';
    echo json_encode($response);
    exit;
}

// Additional validation
if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    $response['errors']['email'] = 'Invalid email format';
}

if (strlen($input['password']) < 8) {
    $response['errors']['password'] = 'Password must be at least 8 characters';
}

// Add password confirmation validation
if ($input['password'] !== $input['confirmPassword']) {
    $response['errors']['confirmPassword'] = 'Passwords do not match';
}

if (!empty($response['errors'])) {
    $response['message'] = 'Validation failed';
    echo json_encode($response);
    exit;
}

// Initialize mysqli with SSL support (like login.php)
$mysqli = mysqli_init();
if (!$mysqli) {
    $response['message'] = 'mysqli_init failed';
    echo json_encode($response);
    exit;
}

// Set SSL options BEFORE connecting
$sslCertPath = '/home/site/wwwroot/certs/DigiCertGlobalRootG2.crt';

if (file_exists($sslCertPath)) {
    $mysqli->ssl_set(NULL, NULL, $sslCertPath, NULL, NULL);
    $mysqli->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, 1);
} else {
    $mysqli->ssl_set(NULL, NULL, NULL, NULL, NULL);
    $mysqli->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, 0);
}

// NOW connect with SSL
if (!@$mysqli->real_connect($host, $user, $pass, $db, (int)$port, NULL, MYSQLI_CLIENT_SSL)) {
    $response['message'] = 'Database connection failed: ' . $mysqli->connect_error;
    echo json_encode($response);
    exit;
}

$mysqli->set_charset('utf8mb4');

// Start transaction
$mysqli->begin_transaction();

try {
    // Generate username from email (before @ symbol)
    $username = substr($input['email'], 0, strpos($input['email'], '@'));
    $base_username = $username;
    $counter = 1;
    
    // Check if username exists and make it unique
    $stmt = $mysqli->prepare("SELECT user_id FROM user_account WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->store_result();
    
    while ($stmt->num_rows > 0) {
        $username = $base_username . $counter;
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $stmt->store_result();
        $counter++;
    }
    $stmt->close();
    
    // Check if email already exists
    $stmt = $mysqli->prepare("SELECT user_id FROM user_account WHERE email = ?");
    $stmt->bind_param("s", $input['email']);
    $stmt->execute();
    $stmt->store_result();
    
    if ($stmt->num_rows > 0) {
        throw new Exception('Email already registered');
    }
    $stmt->close();
    
    // Hash password
    $password_hash = password_hash($input['password'], PASSWORD_DEFAULT);
    
    // Insert into user_account table
    $stmt = $mysqli->prepare(
        "INSERT INTO user_account (username, email, password_hash, role, is_active) 
         VALUES (?, ?, ?, 'PATIENT', 1)"
    );
    $stmt->bind_param("sss", $username, $input['email'], $password_hash);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to create user account');
    }
    
    $user_id = $mysqli->insert_id;
    $stmt->close();
    
    // Map gender value to code (matching your SMALLINT field)
    // Assuming: 1 = Male, 2 = Female, 3 = Other, 4 = Prefer not to say
    $gender_map = [
        'male' => 1,
        'female' => 2,
        'other' => 3,
        'prefer-not-to-say' => 4
    ];
    $assigned_gender = $gender_map[strtolower($input['gender'])] ?? 3;
    
    // Generate SSN placeholder (you should implement proper SSN handling)
    // For now, using a temporary placeholder
    $ssn = 'TEMP' . str_pad($user_id, 7, '0', STR_PAD_LEFT);
    
    // Format phone number (remove non-numeric characters)
    $phone = preg_replace('/[^0-9]/', '', $input['phone']);
    
    // Format emergency contact
    $emergency_contact = null;
    if (!empty($input['emergencyContact']) && !empty($input['emergencyPhone'])) {
        $emergency_phone = preg_replace('/[^0-9]/', '', $input['emergencyPhone']);
        $emergency_contact = $input['emergencyContact'] . ':' . $emergency_phone;
    }
    
    // Insert into Patient table - Using PascalCase column names to match schema
// ----- Derived fields for Patient -----
    $first_name = trim($input['firstName']);
    $last_name  = trim($input['lastName']);

    try {
        $dob = (new DateTime($input['dateOfBirth']))->format('Y-m-d');
    } catch (Exception $e) {
        throw new Exception('Invalid date of birth format');
    }

    // $ssn already set above as TEMP + user_id

    // Emergency contact: store digits only (VARCHAR(15))
    $emergency_contact = null;
    if (!empty($input['emergencyPhone'])) {
        $emergency_contact = substr(preg_replace('/[^0-9]/', '', $input['emergencyPhone']), 0, 15);
    }

    // Gender map (SMALLINT)
    $gender_map = [
        'male' => 1, 'female' => 2, 'other' => 3, 'prefer-not-to-say' => 4
    ];
    $assigned_at_birth_gender = $gender_map[strtolower($input['gender'])] ?? 3;
    $gender = $assigned_at_birth_gender;

    // Optional codes
    $ethnicity = (isset($input['ethnicity']) && $input['ethnicity'] !== '') ? (int)$input['ethnicity'] : null;
    $race      = (isset($input['race']) && $input['race'] !== '') ? (int)$input['race'] : null;

    $email = $input['email'];

    $primary_doctor     = (isset($input['primaryDoctor'])     && $input['primaryDoctor']     !== '') ? (int)$input['primaryDoctor']     : null;
    $specialty_doctor   = (isset($input['specialtyDoctor'])   && $input['specialtyDoctor']   !== '') ? (int)$input['specialtyDoctor']   : null;
    $insurance_id       = (isset($input['insuranceId'])       && $input['insuranceId']       !== '') ? (int)$input['insuranceId']       : null;
    $insurance_provider = (isset($input['insuranceProvider']) && $input['insuranceProvider'] !== '') ? (int)$input['insuranceProvider'] : null;
    $prescription       = (isset($input['prescriptionId'])    && $input['prescriptionId']    !== '') ? (int)$input['prescriptionId']    : null;
    $allergies          = (isset($input['allergiesCode'])     && $input['allergiesCode']     !== '') ? (int)$input['allergiesCode']     : null;
    $blood_type         = (isset($input['bloodType'])         && $input['bloodType']         !== '') ? $input['bloodType']              : null;

    // ----- INSERT into Patient -----
    $stmt = $mysqli->prepare(
        "INSERT INTO Patient (
            first_name,
            last_name,
            dob,
            ssn,
            emergency_contact,
            assigned_at_birth_gender,
            gender,
            ethnicity,
            race,
            email,
            primary_doctor,
            specialty_doctor,
            insurance_id,
            insurance_provider,
            prescription,
            allergies,
            blood_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    // Types: sssss | iiii | s | iiiiii | s  (total 17)
    $stmt->bind_param(
        'sssssiiiisiiiiiis',
        $first_name,
        $last_name,
        $dob,
        $ssn,
        $emergency_contact,
        $assigned_at_birth_gender,
        $gender,
        $ethnicity,
        $race,
        $email,
        $primary_doctor,
        $specialty_doctor,
        $insurance_id,
        $insurance_provider,
        $prescription,
        $allergies,
        $blood_type
    );

    if (!$stmt->execute()) {
        throw new Exception('Failed to create patient record: ' . $stmt->error);
    }
    $patient_id = $mysqli->insert_id;
    $stmt->close();
    
    // Commit transaction
    $mysqli->commit();
    
    $response['success'] = true;
    $response['message'] = 'Account created successfully';
    $response['data'] = [
        'user_id' => $user_id,
        'patient_id' => $patient_id,
        'username' => $username,
        'password_hash' => $password_hash  // Return hash so you can use it for other users
    ];
    
} catch (Exception $e) {
    // Rollback transaction on error
    $mysqli->rollback();
    $response['message'] = $e->getMessage();
} finally {
    // Close connection
    $mysqli->close();
}

// Return response
echo json_encode($response);
?>