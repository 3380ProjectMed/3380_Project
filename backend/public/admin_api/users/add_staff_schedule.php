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

$staffId = $input['staff_id'] ?? null;
$officeId = $input['office_id'] ?? null;
$dayOfWeek = $input['day_of_week'] ?? null;

if (!$staffId || !$officeId || !$dayOfWeek) {
    echo json_encode(['success' => false, 'error' => 'Missing parameters']);
    exit;
}

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Get the template schedule for this office and day
    $templateQuery = "
        SELECT start_time, end_time
        FROM WorkSchedule
        WHERE office_id = :office_id
        AND day_of_week = :day_of_week
        AND staff_id IS NULL
        LIMIT 1";
    
    $templateStmt = $conn->prepare($templateQuery);
    $templateStmt->bindParam(':office_id', $officeId);
    $templateStmt->bindParam(':day_of_week', $dayOfWeek);
    $templateStmt->execute();
    
    $template = $templateStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$template) {
        echo json_encode(['success' => false, 'error' => 'Template schedule not found']);
        exit;
    }
    
    // Check if staff already has a schedule for this day
    $checkQuery = "
        SELECT schedule_id
        FROM WorkSchedule
        WHERE staff_id = :staff_id
        AND day_of_week = :day_of_week";
    
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bindParam(':staff_id', $staffId);
    $checkStmt->bindParam(':day_of_week', $dayOfWeek);
    $checkStmt->execute();
    
    if ($checkStmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Staff already has a schedule for this day']);
        exit;
    }
    
    // Create new schedule entry for this staff member
    $insertQuery = "
        INSERT INTO WorkSchedule (office_id, staff_id, days, start_time, end_time, day_of_week)
        VALUES (:office_id, :staff_id, :days, :start_time, :end_time, :day_of_week)";
    
    $insertStmt = $conn->prepare($insertQuery);
    $insertStmt->bindParam(':office_id', $officeId);
    $insertStmt->bindParam(':staff_id', $staffId);
    $insertStmt->bindParam(':days', $dayOfWeek);
    $insertStmt->bindParam(':start_time', $template['start_time']);
    $insertStmt->bindParam(':end_time', $template['end_time']);
    $insertStmt->bindParam(':day_of_week', $dayOfWeek);
    
    $insertStmt->execute();
    
    echo json_encode([
        'success' => true,
        'message' => 'Schedule added successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in add_staff_schedule.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>