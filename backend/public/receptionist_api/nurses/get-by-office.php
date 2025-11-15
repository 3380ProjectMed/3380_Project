<?php

/**
 * Get all nurses working at a specific office
 * Based on work_schedule table
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {
    // Require authentication
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }

    $office_id = isset($_GET['office_id']) ? (int)$_GET['office_id'] : null;

    if (!$office_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'office_id is required']);
        exit;
    }

    $conn = getDBConnection();

    // Get nurses working at this office from work_schedule
    $sql = "SELECT DISTINCT
                n.nurse_id,
                s.first_name,
                s.last_name,
                n.specialization
            FROM work_schedule ws
            JOIN staff s ON s.staff_id = ws.staff_id
            JOIN nurse n ON n.staff_id = s.staff_id
            WHERE ws.office_id = ?
            AND s.role = 'Nurse'
            ORDER BY s.last_name, s.first_name";

    $nurses = executeQuery($conn, $sql, 'i', [$office_id]);
    
    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'nurses' => $nurses
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
