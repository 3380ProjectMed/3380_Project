<?php
/**
 * Admin API: Get all users
 * Admin API: Get all users
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    session_start();
    
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    
    $conn = getDBConnection();
    
    // Verify user is admin
    $checkSql = "SELECT role FROM user_account WHERE user_id = ?";
    $checkRows = executeQuery($conn, $checkSql, 'i', [(int)$_SESSION['uid']]);
    
    if (empty($checkRows) || $checkRows[0]['role'] !== 'ADMIN') {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }
    
    // Get all users with their associated profiles
    $sql = "SELECT 
                u.user_id,
                u.username,
                u.email,
                u.role,
                u.is_active,
                u.created_at,
                u.last_login_at,
                u.mfa_enabled,
                CASE 
                    WHEN u.role = 'DOCTOR' THEN CONCAT(d.First_Name, ' ', d.Last_Name)
                    WHEN u.role = 'PATIENT' THEN CONCAT(p.First_Name, ' ', p.Last_Name)
                    ELSE u.username
                END as full_name,
                d.Doctor_id,
                p.Patient_ID
            FROM user_account u
            LEFT JOIN Doctor d ON u.email = d.Email AND u.role = 'DOCTOR'
            LEFT JOIN Patient p ON u.email = p.Email AND u.role = 'PATIENT'
            ORDER BY u.created_at DESC";
    
    $users = executeQuery($conn, $sql);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'users' => $users,
        'count' => count($users)
    ]);
    
    
    echo json_encode([
        'success' => true,
        'users' => $users,
        'count' => count($users)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>