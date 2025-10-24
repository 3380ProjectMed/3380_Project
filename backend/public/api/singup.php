<?php
// signup.php
header('Content-Type: application/json');

// Database configuration
$db_host = 'localhost';
$db_user = 'your_username';
$db_pass = 'your_password';
$db_name = 'your_database';

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
$required_fields = ['firstName', 'lastName', 'email', 'password', 'dateOfBirth', 'phone', 'gender'];
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

if (!empty($response['errors'])) {
    $response['message'] = 'Validation failed';
    echo json_encode($response);
    exit;
}

// Create database connection
$mysqli = new mysqli($db_host, $db_user, $db_pass, $db_name);

// Check connection
if ($mysqli->connect_error) {
    $response['message'] = 'Database connection failed';
    echo json_encode($response);
    exit;
}

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
    
    // Map gender value to code
    // Assuming: 1 = Male, 2 = Female, 3 = Other, 4 = Prefer not to say
    $gender_map = [
        'male' => 1,
        'female' => 2,
        'other' => 3,
        'prefer-not-to-say' => 4
    ];
    $assigned_gender = $gender_map[$input['gender']] ?? 3;
    
    // Generate SSN placeholder (you should implement proper SSN handling)
    // For now, using a temporary placeholder - MUST BE REPLACED with actual SSN collection
    $ssn = 'TEMP' . str_pad($user_id, 7, '0', STR_PAD_LEFT);
    
    // Format phone number (remove non-numeric characters)
    $phone = preg_replace('/[^0-9]/', '', $input['phone']);
    
    // Format emergency contact phone if provided
    $emergency_phone = null;
    if (!empty($input['emergencyPhone'])) {
        $emergency_phone = preg_replace('/[^0-9]/', '', $input['emergencyPhone']);
    }
    
    // Prepare emergency contact string
    $emergency_contact = null;
    if (!empty($input['emergencyContact']) && !empty($emergency_phone)) {
        $emergency_contact = $input['emergencyContact'] . ':' . $emergency_phone;
    }
    
    // Insert into Patient table
    $stmt = $mysqli->prepare(
        "INSERT INTO Patient (
            First_Name, 
            Last_Name, 
            dob, 
            SSN, 
            EmergencyContact, 
            AssignedAtBirth_Gender,
            Gender,
            Email, 
            Consent_Disclose,
            PayerType
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'N', 'Self-Pay')"
    );
    
    $stmt->bind_param(
        "sssssiss",
        $input['firstName'],
        $input['lastName'],
        $input['dateOfBirth'],
        $ssn,
        $emergency_contact,
        $assigned_gender,
        $assigned_gender,
        $input['email']
    );
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to create patient record');
    }
    
    $patient_id = $mysqli->insert_id;
    $stmt->close();
    
    // If address information is provided, you might want to store it in a separate address table
    // This is optional based on your database schema
    
    // Commit transaction
    $mysqli->commit();
    
    $response['success'] = true;
    $response['message'] = 'Account created successfully';
    $response['data'] = [
        'user_id' => $user_id,
        'patient_id' => $patient_id,
        'username' => $username
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