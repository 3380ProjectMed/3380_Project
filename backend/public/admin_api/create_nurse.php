<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    session_start();
    
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }
    
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required = ['first_name', 'last_name', 'email', 'password', 'department', 'ssn', 'gender'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => ucfirst(str_replace('_', ' ', $field)) . ' is required']);
            exit;
        }
    }
    
    $conn = getDBConnection();
    
    // Start transaction
    mysqli_begin_transaction($conn);
    
    try {
        // Check if email already exists in staff table
        $checkEmail = executeQuery($conn, 
            "SELECT staff_id FROM staff WHERE staff_email = ?", 
            [$input['email']]
        );
        
        if (count($checkEmail) > 0) {
            throw new Exception('Email already exists');
        }
        
        // Check if SSN already exists
        $checkSSN = executeQuery($conn, 
            "SELECT staff_id FROM staff WHERE ssn = ?", 
            [$input['ssn']]
        );
        
        if (count($checkSSN) > 0) {
            throw new Exception('SSN already exists');
        }
        
        // Create user account for login
        $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
        $username = strtolower($input['first_name'] . '.' . $input['last_name']);
        $email = $input['email'];
        
        $userInsert = "INSERT INTO user_account (username, email, password_hash, role, is_active) 
                       VALUES (?, ?, ?, 'NURSE', 1)";
        
        $stmt = $conn->prepare($userInsert);
        $stmt->bind_param('sss', $username, $email, $passwordHash);
        $stmt->execute();
        $userId = $conn->insert_id;
        $stmt->close();
        
        // Insert staff record
        $firstName = $input['first_name'];
        $lastName = $input['last_name'];
        $ssn = $input['ssn'];
        $gender = $input['gender'];
        $email = $input['email'];
        $workLocation = $input['work_location'] ?? 1;
        $workSchedule = $input['work_schedule'] ?? 1;
        $licenseNumber = $input['license_number'] ?? null;
        
        $staffInsert = "INSERT INTO staff (first_name, last_name, ssn, gender, staff_email, work_location, staff_role, work_schedule, license_number) 
                        VALUES (?, ?, ?, ?, ?, ?, 'Nurse', ?, ?)";
        
        $stmt = $conn->prepare($staffInsert);
        $stmt->bind_param('sssissis', 
            $firstName,
            $lastName,
            $ssn,
            $gender,
            $email,
            $workLocation,
            $workSchedule,
            $licenseNumber
        );
        $stmt->execute();
        $staffId = $conn->insert_id;
        $stmt->close();
        
        // Insert nurse record (links staff to department)
        $nurseInsert = "INSERT INTO nurse (staff_id, department) VALUES (?, ?)";
        
        $stmt = $conn->prepare($nurseInsert);
        $stmt->bind_param('is', $staffId, $input['department']);
        $stmt->execute();
        $nurseId = $conn->insert_id;
        $stmt->close();
        
        // Commit transaction
        mysqli_commit($conn);
        
        closeDBConnection($conn);
        
        echo json_encode([
            'success' => true,
            'message' => 'Nurse added successfully',
            'nurse_id' => $nurseId,
            'staff_id' => $staffId
        ]);
        
    } catch (Exception $e) {
        mysqli_rollback($conn);
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>