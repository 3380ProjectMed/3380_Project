<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    //session_start();

    // Verify admin access
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    $required = [
        'first_name',
        'last_name',
        'email',
        'password',
        'ssn',
        'gender',
        'work_location',
        'work_schedule',
        'department'
    ];

    foreach ($required as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Missing required field: $field"]);
            exit;
        }
    }

    $conn = getDBConnection();

    // Check if email already exists
    $checkQuery = "SELECT staff_email FROM staff WHERE staff_email = ? 
                   UNION 
                   SELECT email FROM user_account WHERE email = ?";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bind_param("ss", $input['email'], $input['email']);
    $checkStmt->execute();
    $result = $checkStmt->get_result();

    if ($result->num_rows > 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email already exists in the system']);
        exit;
    }

    // Start transaction
    $conn->begin_transaction();

    try {
        // Insert into staff table
        $staffQuery = "INSERT INTO staff (
            first_name, 
            last_name, 
            ssn, 
            gender, 
            staff_email, 
            work_location, 
            staff_role, 
            work_schedule, 
            license_number
        ) VALUES (?, ?, ?, ?, ?, ?, 'Nurse', ?, ?)";

        $staffStmt = $conn->prepare($staffQuery);
        $staffStmt->bind_param(
            "ssissiis",
            $input['first_name'],
            $input['last_name'],
            $input['ssn'],
            $input['gender'],
            $input['email'],
            $input['work_location'],
            $input['work_schedule'],
            $input['license_number']
        );

        if (!$staffStmt->execute()) {
            throw new Exception("Failed to insert staff: " . $staffStmt->error);
        }

        $staff_id = $conn->insert_id;

        // Insert into nurse table
        $nurseQuery = "INSERT INTO nurse (
            staff_id, 
            department
        ) VALUES (?, ?)";

        $nurseStmt = $conn->prepare($nurseQuery);
        $nurseStmt->bind_param(
            "is",
            $staff_id,
            $input['department']
        );

        if (!$nurseStmt->execute()) {
            throw new Exception("Failed to insert nurse: " . $nurseStmt->error);
        }

        $nurse_id = $conn->insert_id;

        // Hash password
        $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);

        // Insert into user_account table
        $userQuery = "INSERT INTO user_account (
            email, 
            password, 
            role, 
            is_active
        ) VALUES (?, ?, 'NURSE', 1)";

        $userStmt = $conn->prepare($userQuery);
        $userStmt->bind_param(
            "ss",
            $input['email'],
            $hashedPassword
        );

        if (!$userStmt->execute()) {
            throw new Exception("Failed to create user account: " . $userStmt->error);
        }

        // Commit transaction
        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Nurse added successfully',
            'nurse_id' => $nurse_id,
            'staff_id' => $staff_id
        ]);
    } catch (Exception $e) {
        // Rollback on error
        $conn->rollback();
        throw $e;
    }

    closeDBConnection($conn);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
