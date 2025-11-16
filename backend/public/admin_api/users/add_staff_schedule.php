<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $staffId = $input['staff_id'] ?? null;
    $officeId = $input['office_id'] ?? null;
    $dayOfWeek = $input['day_of_week'] ?? null;

    if (!$staffId || !$officeId || !$dayOfWeek) {
        echo json_encode(['success' => false, 'error' => 'Missing parameters']);
        exit;
    }

    $conn = getDBConnection();
    
    // Get the template schedule for this office and day
    $templateQuery = "
        SELECT start_time, end_time
        FROM work_schedule
        WHERE office_id = ?
        AND day_of_week = ?
        LIMIT 1";
    
    $templateResults = executeQuery($conn, $templateQuery, 'is', [$officeId, $dayOfWeek]);
    
    if (empty($templateResults)) {
        echo json_encode(['success' => false, 'error' => 'Template schedule not found']);
        closeDBConnection($conn);
        exit;
    }
    
    $template = $templateResults[0];
    
    // Check if staff already has a schedule for this day
    $checkQuery = "
        SELECT schedule_id
        FROM work_schedule
        WHERE staff_id = ?
        AND day_of_week = ?";
    
    $checkResults = executeQuery($conn, $checkQuery, 'is', [$staffId, $dayOfWeek]);
    
    if (!empty($checkResults)) {
        echo json_encode(['success' => false, 'error' => 'Staff already has a schedule for this day']);
        closeDBConnection($conn);
        exit;
    }
    
    // Create new schedule entry for this staff member
    $insertQuery = "
        INSERT INTO work_schedule (office_id, staff_id, days, start_time, end_time, day_of_week)
        VALUES (?, ?, ?, ?, ?, ?)";
    
    executeQuery(
        $conn, 
        $insertQuery, 
        'iissss', 
        [$officeId, $staffId, $dayOfWeek, $template['start_time'], $template['end_time'], $dayOfWeek]
    );
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'message' => 'Schedule added successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Error in add_staff_schedule.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>