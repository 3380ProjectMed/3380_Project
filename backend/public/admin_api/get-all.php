<?php
/**
 * Admin API: Get all users
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    session_start();
    
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
                    WHEN u.role = 'DOCTOR' THEN CONCAT(d.first_Name, ' ', d.last_Name)
                    WHEN u.role = 'PATIENT' THEN CONCAT(p.first_Name, ' ', p.last_Name)
                    ELSE u.username
                END as full_name,
                d.doctor_id,
                p.patient_ID
            FROM user_account u
            LEFT JOIN doctor d ON u.email = d.email AND u.role = 'DOCTOR'
            LEFT JOIN patient p ON u.email = p.email AND u.role = 'PATIENT'
            ORDER BY u.created_at DESC";
    
    $users = executeQuery($conn, $sql);
    
    closeDBConnection($conn);
    
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