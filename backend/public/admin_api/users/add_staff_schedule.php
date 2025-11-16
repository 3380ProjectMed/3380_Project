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

    // Accept custom times (optional - will use template if not provided)
    $customStartTime = $input['start_time'] ?? null;
    $customEndTime = $input['end_time'] ?? null;

    if (!$staffId || !$officeId || !$dayOfWeek) {
        echo json_encode(['success' => false, 'error' => 'Missing parameters']);
        exit;
    }

    $conn = getDBConnection();

    // Get the template schedule for this office and day
    // Templates are stored in work_schedule_templates
    $templateQuery = "
        SELECT start_time, end_time
        FROM work_schedule_templates
        WHERE office_id = ?
        AND day_of_week = ?
        AND staff_id IS NULL
        LIMIT 1";

    $templateResults = executeQuery($conn, $templateQuery, 'is', [$officeId, $dayOfWeek]);

    if (empty($templateResults)) {
        echo json_encode(['success' => false, 'error' => 'Template schedule not found for this office and day']);
        closeDBConnection($conn);
        exit;
    }

    $template = $templateResults[0];

    // Use custom times if provided, otherwise use template times
    $startTime = $customStartTime ?? $template['start_time'];
    $endTime = $customEndTime ?? $template['end_time'];

    // Check if staff already has a schedule for this day AND office combination
    // Staff can work multiple shifts per day at different offices
    $checkQuery = "
        SELECT schedule_id
        FROM work_schedule
        WHERE staff_id = ?
        AND day_of_week = ?
        AND office_id = ?";

    $checkResults = executeQuery($conn, $checkQuery, 'isi', [$staffId, $dayOfWeek, $officeId]);

    if (!empty($checkResults)) {
        echo json_encode(['success' => false, 'error' => 'Staff already has a schedule for this day at this office']);
        closeDBConnection($conn);
        exit;
    }

    // Create new schedule entry for this staff member
    $insertQuery = "
        INSERT INTO work_schedule (office_id, staff_id, day_of_week, start_time, end_time)
        VALUES (?, ?, ?, ?, ?)";

    executeQuery(
        $conn,
        $insertQuery,
        'iisss',
        [$officeId, $staffId, $dayOfWeek, $startTime, $endTime]
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
