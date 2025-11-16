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
    
    // Get schedule templates - optionally filtered by office_id
    $officeId = $_GET['office_id'] ?? null;
    
    $schedulesQuery = "
        SELECT 
            office_id,
            GROUP_CONCAT(day_of_week ORDER BY 
                CASE day_of_week
                    WHEN 'Monday' THEN 1
                    WHEN 'Tuesday' THEN 2
                    WHEN 'Wednesday' THEN 3
                    WHEN 'Thursday' THEN 4
                    WHEN 'Friday' THEN 5
                    WHEN 'Saturday' THEN 6
                    WHEN 'Sunday' THEN 7
                END
                SEPARATOR ', ') as days,
            start_time,
            end_time,
            CONCAT(
                GROUP_CONCAT(
                    SUBSTRING(day_of_week, 1, 3) 
                    ORDER BY 
                        CASE day_of_week
                            WHEN 'Monday' THEN 1
                            WHEN 'Tuesday' THEN 2
                            WHEN 'Wednesday' THEN 3
                            WHEN 'Thursday' THEN 4
                            WHEN 'Friday' THEN 5
                            WHEN 'Saturday' THEN 6
                            WHEN 'Sunday' THEN 7
                        END
                    SEPARATOR ', '
                ),
                ' (',
                DATE_FORMAT(start_time, '%h:%i %p'),
                ' - ',
                DATE_FORMAT(end_time, '%h:%i %p'),
                ')'
            ) as schedule_label
        FROM work_schedule_templates";
    
    $scheduleParams = [];
    $scheduleTypes = '';
    
    if ($officeId && $officeId !== 'all') {
        $schedulesQuery .= " WHERE office_id = ?";
        $scheduleParams = [(int)$officeId];
        $scheduleTypes = 'i';
    }
    
    $schedulesQuery .= " GROUP BY office_id, start_time, end_time ORDER BY office_id, start_time";
    
    $workSchedules = executeQuery($conn, $schedulesQuery, $scheduleTypes, $scheduleParams);
    
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