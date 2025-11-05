<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    session_start();
    
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }
    
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    
    if ($user_id === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'user_id is required']);
        exit;
    }
    
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
            WHEN u.role = 'DOCTOR'  THEN CONCAT(d.first_name, ' ', d.last_name)
            WHEN u.role = 'PATIENT' THEN CONCAT(p.first_name, ' ', p.last_name)
            ELSE u.username
        END AS full_name,
        d.doctor_id,
        d.phone       AS doctor_phone,
        d.license_number,
        p.patient_id,
        ec.ec_phone   AS emergency_contact_phone
        FROM user_account u
        LEFT JOIN doctor  d  ON u.role = 'DOCTOR'  AND d.email = u.email
        LEFT JOIN patient p  ON u.role = 'PATIENT' AND p.email = u.email
        LEFT JOIN emergency_contact ec ON ec.patient_id = p.patient_id
        WHERE u.user_id = ?";
    
    $result = executeQuery($conn, $sql, 'i', [$user_id]);
    
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
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>