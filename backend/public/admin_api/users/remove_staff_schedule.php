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
    
    // Delete the schedule (only if it has a staff_id, not templates)
    $deleteQuery = "DELETE FROM work_schedule WHERE schedule_id = ? AND staff_id IS NOT NULL";
    
    $result = executeQuery($conn, $deleteQuery, 'i', [$scheduleId]);
    
    // Check if any rows were affected
    // Note: executeQuery doesn't return affected rows, so we verify by checking if schedule still exists
    $checkQuery = "SELECT schedule_id FROM work_schedule WHERE schedule_id = ?";
    $checkResults = executeQuery($conn, $checkQuery, 'i', [$scheduleId]);
    
    closeDBConnection($conn);
    
    if (!empty($checkResults)) {
        echo json_encode(['success' => false, 'error' => 'Schedule not found or cannot be deleted']);
        exit;
    }
    
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