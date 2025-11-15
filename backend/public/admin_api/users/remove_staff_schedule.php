<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'ADMIN') {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

require_once '../../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);

$scheduleId = $input['schedule_id'] ?? null;

if (!$scheduleId) {
    echo json_encode(['success' => false, 'error' => 'Missing schedule ID']);
    exit;
}

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Delete the schedule
    $deleteQuery = "DELETE FROM WorkSchedule WHERE schedule_id = :schedule_id AND staff_id IS NOT NULL";
    
    $deleteStmt = $conn->prepare($deleteQuery);
    $deleteStmt->bindParam(':schedule_id', $scheduleId);
    $deleteStmt->execute();
    
    if ($deleteStmt->rowCount() === 0) {
        echo json_encode(['success' => false, 'error' => 'Schedule not found or cannot be deleted']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Schedule removed successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in remove_staff_schedule.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>