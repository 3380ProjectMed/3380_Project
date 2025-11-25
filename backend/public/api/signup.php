<?php
// signup.php
header('Content-Type: application/json');

$host = getenv('AZURE_MYSQL_HOST') ?: '';
$user = getenv('AZURE_MYSQL_USERNAME') ?: '';
$pass = getenv('AZURE_MYSQL_PASSWORD') ?: '';
$db   = getenv('AZURE_MYSQL_DBNAME') ?: '';
$port = getenv('AZURE_MYSQL_PORT') ?: '3306';

$response = [
    'success' => false,
    'message' => '',
    'errors' => []
];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Invalid request method';
    echo json_encode($response);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$required_fields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'dateOfBirth', 'phone', 'gender', 'ssn'];
foreach ($required_fields as $field) {
    if (empty($input[$field])) {
        $response['errors'][$field] = ucfirst(str_replace('_', ' ', $field)) . ' is required';
    }
}

if (!empty($response['errors'])) {
    $response['message'] = 'Please fill in all required fields';
    echo json_encode($response);
    exit;
}

if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    $response['errors']['email'] = 'Invalid email format';
}

if (strlen($input['password']) < 8) {
    $response['errors']['password'] = 'Password must be at least 8 characters';
}

if ($input['password'] !== $input['confirmPassword']) {
    $response['errors']['confirmPassword'] = 'Passwords do not match';
}

$ssn_digits = preg_replace('/\D/', '', $input['ssn']);
if (strlen($ssn_digits) !== 9) {
    $response['errors']['ssn'] = 'SSN must be exactly 9 digits';
}

if (!empty($response['errors'])) {
    $response['message'] = 'Validation failed';
    echo json_encode($response);
    exit;
}

$mysqli = mysqli_init();
if (!$mysqli) {
    $response['message'] = 'mysqli_init failed';
    echo json_encode($response);
    exit;
}

$sslCertPath = '/home/site/wwwroot/certs/DigiCertGlobalRootG2.crt';

if (file_exists($sslCertPath)) {
    $mysqli->ssl_set(NULL, NULL, $sslCertPath, NULL, NULL);
    $mysqli->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, 1);
} else {
    $mysqli->ssl_set(NULL, NULL, NULL, NULL, NULL);
    $mysqli->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, 0);
}

if (!@$mysqli->real_connect($host, $user, $pass, $db, (int)$port, NULL, MYSQLI_CLIENT_SSL)) {
    $response['message'] = 'Database connection failed: ' . $mysqli->connect_error;
    echo json_encode($response);
    exit;
}

$mysqli->set_charset('utf8mb4');

$mysqli->begin_transaction();

try {
    $username = substr($input['email'], 0, strpos($input['email'], '@'));
    $base_username = $username;
    $counter = 1;

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

    $stmt = $mysqli->prepare("SELECT user_id FROM user_account WHERE email = ?");
    $stmt->bind_param("s", $input['email']);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        throw new Exception('Email already registered');
    }
    $stmt->close();

    $password_hash = password_hash($input['password'], PASSWORD_DEFAULT);

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

    $first_name = trim($input['firstName']);
    $last_name  = trim($input['lastName']);
    $email = $input['email'];

    try {
        $dob = (new DateTime($input['dateOfBirth']))->format('Y-m-d');
    } catch (Exception $e) {
        throw new Exception('Invalid date of birth format');
    }

    $ssn = preg_replace('/\D/', '', $input['ssn']);

    $gender_map = ['male' => 1, 'female' => 2, 'other' => 3, 'prefer-not-to-say' => 4];
    $assigned_at_birth_gender = $gender_map[strtolower($input['gender'])] ?? 3;
    $gender = $assigned_at_birth_gender;

    $ec_fn  = isset($input['emergencyContactfn']) && trim($input['emergencyContactfn']) !== '' ? trim($input['emergencyContactfn']) : null;
    $ec_ln  = isset($input['emergencyContactln']) && trim($input['emergencyContactln']) !== '' ? trim($input['emergencyContactln']) : null;
    $ec_rel = isset($input['emergencyContactrl']) && trim($input['emergencyContactrl']) !== '' ? trim($input['emergencyContactrl']) : null;
    $ec_ph  = isset($input['emergencyPhone'])     && trim($input['emergencyPhone'])     !== '' ? substr(preg_replace('/\D+/', '', $input['emergencyPhone']), 0, 15) : null;

    $stmt = $mysqli->prepare(
        "INSERT INTO patient (
                patient_id,
                first_name,
                last_name,
                dob,
                ssn,
                assigned_at_birth_gender,
                gender,
                email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );

    $stmt->bind_param(
        'issssiis',
        $user_id,          
        $first_name,
        $last_name,
        $dob,
        $ssn,
        $assigned_at_birth_gender,
        $gender,
        $email
    );

    if (!$stmt->execute()) {
        throw new Exception('Failed to create patient record: ' . $stmt->error);
    }
    $stmt->close();

    $patient_id = $user_id;


    if ($ec_fn || $ec_ln || $ec_rel || $ec_ph) {
        $stmt = $mysqli->prepare(
            "INSERT INTO emergency_contact (
            patient_id,
            ec_first_name,
            ec_last_name,
            ec_phone,
            relationship
        ) VALUES (?, ?, ?, ?, ?)"
        );

        $stmt->bind_param("issss", $patient_id, $ec_fn, $ec_ln, $ec_ph, $ec_rel);

        if (!$stmt->execute()) {
            throw new Exception('Failed to create emergency contact: ' . $stmt->error);
        }
        $stmt->close();
        $ec_id = $mysqli->insert_id;

        $stmt = $mysqli->prepare(
            "UPDATE patient SET emergency_contact_id = ? WHERE patient_id = ?"
        );

        if (!$stmt) {
            throw new Exception("Prepare failed (update patient): " . $mysqli->error);
        }

        $stmt->bind_param("ii", $ec_id, $patient_id);

        if (!$stmt->execute()) {
            throw new Exception("Execute failed (update patient): " . $stmt->error);
        }
    }

    $mysqli->commit();

    $response['success'] = true;
    $response['message'] = 'Account created successfully';
} catch (Exception $e) {
    $mysqli->rollback();
    $response['message'] = $e->getMessage();
} finally {
    $mysqli->close();
}

echo json_encode($response);