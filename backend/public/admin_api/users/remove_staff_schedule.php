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

    $scheduleId = $input['schedule_id'] ?? null;

    if (!$scheduleId) {
        echo json_encode(['success' => false, 'error' => 'Missing schedule ID']);
        exit;
    }

    $conn = getDBConnection();
    
    $checkQuery = "SELECT schedule_id, staff_id FROM work_schedule WHERE schedule_id = ?";
    $checkResults = executeQuery($conn, $checkQuery, 'i', [$scheduleId]);
    
    if (empty($checkResults)) {
        echo json_encode(['success' => false, 'error' => 'Schedule not found']);
        closeDBConnection($conn);
        exit;
    }
    
    if ($checkResults[0]['staff_id'] === null) {
        echo json_encode(['success' => false, 'error' => 'Cannot delete template schedules']);
        closeDBConnection($conn);
        exit;
    }
    
    // Delete the schedule
    $deleteQuery = "DELETE FROM work_schedule WHERE schedule_id = ?";
    executeQuery($conn, $deleteQuery, 'i', [$scheduleId]);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'message' => 'Schedule removed successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Error in remove_staff_schedule.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>