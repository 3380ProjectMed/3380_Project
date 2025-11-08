<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    session_start();
    
    // Verify admin access
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid input']);
        exit;
    }
    
    // Validate required fields
    $firstName = trim($input['firstName'] ?? '');
    $lastName = trim($input['lastName'] ?? '');
    $email = trim($input['email'] ?? '');
    $username = trim($input['username'] ?? '');
    $phone = trim($input['phone'] ?? '');
    
    if (empty($firstName) || empty($lastName) || empty($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'First name, last name, and email are required']);
        exit;
    }
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid email format']);
        exit;
    }
    
    $conn = getDBConnection();
    $user_id = $_SESSION['uid'];
    
    // Get current user's email to check if it's changing
    $current_query = "SELECT email FROM user_account WHERE user_id = ?";
    $stmt = $conn->prepare($current_query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $current_user = $result->fetch_assoc();
    $stmt->close();
    
    if (!$current_user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User account not found']);
        closeDBConnection($conn);
        exit;
    }
    
    $current_email = $current_user['email'];
    $email_changed = ($current_email !== $email);
    
    // If email is changing, check if new email already exists
    if ($email_changed) {
        $check_query = "SELECT user_id FROM user_account WHERE email = ? AND user_id != ?";
        $stmt = $conn->prepare($check_query);
        $stmt->bind_param("si", $email, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Email already in use by another account']);
            $stmt->close();
            closeDBConnection($conn);
            exit;
        }
        $stmt->close();
    }
    
    // If username is provided and changed, check if it's unique
    if (!empty($username)) {
        $check_username_query = "SELECT username FROM user_account WHERE user_id = ?";
        $stmt = $conn->prepare($check_username_query);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $current_username = $result->fetch_assoc()['username'] ?? '';
        $stmt->close();
        
        if ($username !== $current_username) {
            $check_query = "SELECT user_id FROM user_account WHERE username = ? AND user_id != ?";
            $stmt = $conn->prepare($check_query);
            $stmt->bind_param("si", $username, $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Username already in use']);
                $stmt->close();
                closeDBConnection($conn);
                exit;
            }
            $stmt->close();
        }
    }
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // Update user_account table
        $update_user_query = "UPDATE user_account 
                             SET email = ?, 
                                 username = COALESCE(NULLIF(?, ''), username),
                                 updated_at = CURRENT_TIMESTAMP 
                             WHERE user_id = ?";
        $stmt = $conn->prepare($update_user_query);
        $stmt->bind_param("ssi", $email, $username, $user_id);
        $stmt->execute();
        $stmt->close();
        
        // Update staff table
        $update_staff_query = "UPDATE staff 
                              SET first_name = ?, 
                                  last_name = ?, 
                                  staff_email = ?
                              WHERE staff_email = ? AND staff_role = 'Administrator'";
        $stmt = $conn->prepare($update_staff_query);
        $stmt->bind_param("ssss", $firstName, $lastName, $email, $current_email);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            // Admin might not be in staff table, try to insert
            // First check if they exist by user email
            $check_staff = "SELECT staff_id FROM staff WHERE staff_email = ?";
            $check_stmt = $conn->prepare($check_staff);
            $check_stmt->bind_param("s", $current_email);
            $check_stmt->execute();
            $check_result = $check_stmt->get_result();
            
            if ($check_result->num_rows === 0) {
                // Create staff record for admin
                $insert_staff = "INSERT INTO staff (first_name, last_name, staff_email, staff_role, ssn, gender, work_location, work_schedule) 
                                VALUES (?, ?, ?, 'Administrator', '000-00-0000', 1, 1, 1)";
                $insert_stmt = $conn->prepare($insert_staff);
                $insert_stmt->bind_param("sss", $firstName, $lastName, $email);
                $insert_stmt->execute();
                $insert_stmt->close();
            }
            $check_stmt->close();
        }
        $stmt->close();
        
        // Update session email if changed
        if ($email_changed) {
            $_SESSION['email'] = $email;
        }
        
        // Commit transaction
        $conn->commit();
        
        // Get updated profile
        $profile_query = "SELECT 
                            s.first_name as firstName,
                            s.last_name as lastName,
                            ua.email,
                            ua.username,
                            s.ssn,
                            s.gender,
                            s.work_location as workLocation,
                            o.name as workLocationName,
                            s.staff_role as role,
                            ua.is_active as isActive,
                            ua.created_at as createdAt
                         FROM user_account ua
                         LEFT JOIN staff s ON ua.email = s.staff_email
                         LEFT JOIN office o ON s.work_location = o.office_id
                         WHERE ua.user_id = ?";
        $stmt = $conn->prepare($profile_query);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $profile = $result->fetch_assoc();
        $stmt->close();
        
        closeDBConnection($conn);
        
        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully',
            'profile' => $profile
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
?>