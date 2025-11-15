<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'ADMIN') {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

require_once '../../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Get work locations from Office table
    $locationsQuery = "SELECT office_id, name, address FROM Office ORDER BY name";
    $locationsStmt = $conn->prepare($locationsQuery);
    $locationsStmt->execute();
    $workLocations = $locationsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get work schedules from WorkSchedule table
    $schedulesQuery = "SELECT schedule_id, shift_type FROM WorkSchedule ORDER BY schedule_id";
    $schedulesStmt = $conn->prepare($schedulesQuery);
    $schedulesStmt->execute();
    $workSchedules = $schedulesStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'work_locations' => $workLocations,
        'work_schedules' => $workSchedules
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in get_form_options.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>