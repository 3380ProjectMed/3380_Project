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
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required = ['first_name', 'last_name', 'email', 'password', 'ssn', 'gender', 
                 'work_location', 'work_schedule', 'specialization'];
    
    foreach ($required as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Missing required field: $field"]);
            exit;
        }
    }
    
    $conn = getDBConnection();
    
    $checkQuery = "SELECT email FROM doctor WHERE email = ? 
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
    
    $conn->begin_transaction();
    
    try {
        $specialtyQuery = "SELECT specialty_id FROM specialty WHERE specialty_name = ?";
        $specialtyStmt = $conn->prepare($specialtyQuery);
        $specialtyStmt->bind_param("s", $input['specialization']);
        $specialtyStmt->execute();
        $specialtyResult = $specialtyStmt->get_result();
        
        if ($specialtyResult->num_rows > 0) {
            $specialty_id = $specialtyResult->fetch_assoc()['specialty_id'];

            $insertSpecialtyQuery = "INSERT INTO specialty (specialty_name) VALUES (?)";
            $insertSpecialtyStmt = $conn->prepare($insertSpecialtyQuery);
            $insertSpecialtyStmt->bind_param("s", $input['specialization']);
            $insertSpecialtyStmt->execute();
            $specialty_id = $conn->insert_id;
        }
        
        $doctorQuery = "INSERT INTO doctor (
            first_name, 
            last_name, 
            email, 
            phone, 
            ssn, 
            gender, 
            specialty, 
            work_location, 
            work_schedule, 
            license_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $doctorStmt = $conn->prepare($doctorQuery);
        $doctorStmt->bind_param(
            "sssssiiiis",
            $input['first_name'],
            $input['last_name'],
            $input['email'],
            $input['phone_number'],
            $input['ssn'],
            $input['gender'],
            $specialty_id,
            $input['work_location'],
            $input['work_schedule'],
            $input['license_number']
        );
        
        if (!$doctorStmt->execute()) {
            throw new Exception("Failed to insert doctor: " . $doctorStmt->error);
        }
        
        $doctor_id = $conn->insert_id;
        
        $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
        
        $userQuery = "INSERT INTO user_account (
            email, 
            password, 
            role, 
            is_active
        ) VALUES (?, ?, 'DOCTOR', 1)";
        
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
            'message' => 'Doctor added successfully',
            'doctor_id' => $doctor_id
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
?>