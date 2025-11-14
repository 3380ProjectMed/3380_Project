<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    //session_start();

    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    $conn = getDBConnection();
    $user_id = $_SESSION['uid'];

    $query = "SELECT 
                s.first_name as firstName,
                s.last_name as lastName,
                ua.email,
                ua.username,
                s.ssn,
                s.gender,
                o.office_id as workLocation,
                o.name as workLocationName,
                s.staff_role as role,
                ua.is_active as isActive,
                ua.created_at as createdAt
             FROM user_account ua
             LEFT JOIN staff s ON ua.user_id = s.staff_id AND ua.role IN ('DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN')
             LEFT JOIN work_schedule ws ON s.staff_id = ws.staff_id
             LEFT JOIN office o ON ws.office_id = o.office_id
             WHERE ua.user_id = ?";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $profile = $result->fetch_assoc();
    $stmt->close();

    closeDBConnection($conn);

    if ($profile) {
        echo json_encode([
            'success' => true,
            'profile' => $profile
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Profile not found'
        ]);
    }
} catch (Exception $e) {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
