<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    session_start();
    
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }
    
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    
    if ($user_id === 0) {
    
    $conn = getDBConnection();
    
    $sql = "SELECT 
                u.user_id,
                u.username,
                u.email,
                u.role,
                u.is_active,
                u.created_at,
                u.last_login_at,
                u.mfa_enabled,
                u.failed_login_count,
                CASE 
                    WHEN u.role = 'DOCTOR' THEN CONCAT(d.First_Name, ' ', d.Last_Name)
                    WHEN u.role = 'PATIENT' THEN CONCAT(p.First_Name, ' ', p.Last_Name)
                    ELSE u.username
                END as full_name,
                d.Doctor_id,
                d.Phone as doctor_phone,
                d.License_Number,
                p.Patient_ID,
                p.EmergencyContact as patient_phone
            FROM user_account u
            LEFT JOIN Doctor d ON u.email = d.Email AND u.role = 'DOCTOR'
            LEFT JOIN Patient p ON u.email = p.Email AND u.role = 'PATIENT'
            WHERE u.user_id = ?";
    
    $result = executeQuery($conn, $sql, 'i', [$user_id]);
    
    if (empty($result)) {
        closeDBConnection($conn);
        http_response_code(404);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }
    
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'user' => $result[0]
    if (empty($result)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'user' => $result[0]
    ]);
    
} catch (Exception $e) {
