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

    $conn = getDBConnection();
    
    // Get work locations from Office table
    $locationsQuery = "SELECT office_id, name, address FROM office ORDER BY name";
    $workLocations = executeQuery($conn, $locationsQuery, '', []);
    
    // Get unique shift types from WorkSchedule table (only template schedules)
    $schedulesQuery = "
        SELECT DISTINCT schedule_id, shift_type 
        FROM work_schedule 
        WHERE staff_id IS NULL 
        GROUP BY shift_type
        ORDER BY schedule_id 
        LIMIT 10";
    $workSchedules = executeQuery($conn, $schedulesQuery, '', []);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'work_locations' => $workLocations,
        'work_schedules' => $workSchedules
    ]);
    
} catch (Exception $e) {
    error_log("Error in get_form_options.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>