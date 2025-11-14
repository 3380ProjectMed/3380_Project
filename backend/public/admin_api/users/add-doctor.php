<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
require_once '/home/site/wwwroot/session.php';
try {
    //session_start();

    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !is_array($input)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON body']);
        exit;
    }

    // Match your payload
    $required = [
        'first_name',
        'last_name',
        'email',
        'password',
        'ssn',
        'gender',
        'phone_number',
        'specialization',
        'work_location',
        'work_schedule'
    ];
    foreach ($required as $field) {
        if (!isset($input[$field]) || $input[$field] === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Missing required field: $field"]);
            exit;
        }
    }

    $conn = getDBConnection();

    // Unique email / SSN checks (unchanged)
    $check_email = executeQuery(
        $conn,
        'SELECT staff_id FROM staff WHERE staff_email = ? LIMIT 1',
        's',
        [$input['email']]
    );
    if (!empty($check_email)) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email already in use']);
        exit;
    }

    $check_ssn = executeQuery(
        $conn,
        'SELECT staff_id FROM staff WHERE ssn = ? LIMIT 1',
        's',
        [$input['ssn']]
    );
    if (!empty($check_ssn)) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'SSN already in use']);
        exit;
    }

    $conn->begin_transaction();

    try {
        // 1) staff
        $stmt = $conn->prepare(
            'INSERT INTO staff (
                first_name, last_name, ssn, gender,
                staff_email, phone_number, work_location,
                staff_role, work_schedule, license_number
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        if (!$stmt) {
            throw new Exception('Staff prepare failed: ' . $conn->error);
        }

        $staff_role = 'DOCTOR'; // match your schema
        $license_number = $input['license_number'] ?? null;

        $stmt->bind_param(
            'sssissisis',
            $input['first_name'],
            $input['last_name'],
            $input['ssn'],
            $input['gender'],
            $input['email'],
            $input['phone_number'],
            $input['work_location'],
            $staff_role,
            $input['work_schedule'],
            $license_number
        );

        if (!$stmt->execute()) {
            throw new Exception('Staff insert failed: ' . $stmt->error);
        }

        $staff_id = $conn->insert_id;
        $stmt->close();

        // 2) doctor
        $stmt = $conn->prepare(
            'INSERT INTO doctor (staff_id, specialization) VALUES (?, ?)'
        );
        if (!$stmt) {
            throw new Exception('Doctor prepare failed: ' . $conn->error);
        }

        $stmt->bind_param('is', $staff_id, $input['specialization']);

        if (!$stmt->execute()) {
            throw new Exception('Doctor insert failed: ' . $stmt->error);
        }

        $doctor_id = $conn->insert_id;
        $stmt->close();

        // 3) user_account
        $password_hash = password_hash($input['password'], PASSWORD_DEFAULT);
        $username = $input['username']
            ?? strtolower(substr($input['first_name'], 0, 1) . $input['last_name']);

        $stmt = $conn->prepare(
            'INSERT INTO user_account (user_id, username, email, password_hash, role)
             VALUES (?, ?, ?, ?, ?)'
        );
        if (!$stmt) {
            throw new Exception('User account prepare failed: ' . $conn->error);
        }

        $role = 'DOCTOR';
        $stmt->bind_param(
            'issss',
            $staff_id,
            $username,
            $input['email'],
            $password_hash,
            $role
        );

        if (!$stmt->execute()) {
            throw new Exception('User account insert failed: ' . $stmt->error);
        }

        $stmt->close();
        $conn->commit();
        closeDBConnection($conn);

        echo json_encode([
            'success'  => true,
            'message'  => 'Doctor added successfully',
            'staff_id' => $staff_id,
            'doctor_id' => $doctor_id,
            'user_id'  => $staff_id
        ]);
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
} catch (Exception $e) {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
