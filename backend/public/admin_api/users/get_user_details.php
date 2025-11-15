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

    $userId = $_GET['user_id'] ?? null;
    $userType = $_GET['user_type'] ?? null;

    if (!$userId || !$userType) {
        echo json_encode(['success' => false, 'error' => 'Missing parameters']);
        exit;
    }

    $conn = getDBConnection();

    // Convert userType to uppercase to match database values
    $userType = strtoupper($userType);
    
    // Get user details based on type
    $query = "
        SELECT 
            ua.user_id,
            ua.email,
            ua.is_active,
            s.staff_id,
            s.fname,
            s.lname,
            CONCAT(s.fname, ' ', s.lname) as name,
            s.gender,
            s.phone_number,
            s.license_number,
            o.office_id,
            o.name as work_location,
            o.address as office_address,
            ws.shift_type";
    
    if ($userType === 'DOCTOR') {
        $query .= ", d.specialty";
    } elseif ($userType === 'NURSE') {
        $query .= ", n.department";
    }
    
    $query .= "
        FROM user_account ua
        JOIN staff s ON ua.user_id = s.user_id
        LEFT JOIN office o ON s.office_id = o.office_id
        LEFT JOIN work_schedule ws ON s.schedule_id = ws.schedule_id";
    
    if ($userType === 'DOCTOR') {
        $query .= " LEFT JOIN doctor d ON s.staff_id = d.staff_id";
    } elseif ($userType === 'NURSE') {
        $query .= " LEFT JOIN nurse n ON s.staff_id = n.staff_id";
    }
    
    $query .= " WHERE ua.user_id = ? AND ua.user_type = ?";
    
    $userResults = executeQuery($conn, $query, 'is', [$userId, $userType]);
    
    if (empty($userResults)) {
        echo json_encode(['success' => false, 'error' => 'User not found']);
        closeDBConnection($conn);
        exit;
    }
    
    $user = $userResults[0];
    
    // Get assigned schedules for this staff member
    $schedulesQuery = "
        SELECT schedule_id, day_of_week, start_time, end_time
        FROM work_schedule
        WHERE staff_id = ?
        ORDER BY 
            CASE day_of_week
                WHEN 'Monday' THEN 1
                WHEN 'Tuesday' THEN 2
                WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4
                WHEN 'Friday' THEN 5
                WHEN 'Saturday' THEN 6
                WHEN 'Sunday' THEN 7
            END";
    
    $schedules = executeQuery($conn, $schedulesQuery, 'i', [$user['staff_id']]);
    
    // Get available template schedules from the user's office that aren't already assigned
    $assignedDays = array_column($schedules, 'day_of_week');
    
    $availableQuery = "
        SELECT DISTINCT day_of_week, start_time, end_time
        FROM work_schedule
        WHERE office_id = ?
        AND staff_id IS NULL";
    
    $availableParams = [$user['office_id']];
    $availableTypes = 'i';
    
    if (!empty($assignedDays)) {
        $placeholders = implode(',', array_fill(0, count($assignedDays), '?'));
        $availableQuery .= " AND day_of_week NOT IN ($placeholders)";
        $availableParams = array_merge($availableParams, $assignedDays);
        $availableTypes .= str_repeat('s', count($assignedDays));
    }
    
    $availableQuery .= "
        ORDER BY 
            CASE day_of_week
                WHEN 'Monday' THEN 1
                WHEN 'Tuesday' THEN 2
                WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4
                WHEN 'Friday' THEN 5
                WHEN 'Saturday' THEN 6
                WHEN 'Sunday' THEN 7
            END";
    
    $availableSchedules = executeQuery($conn, $availableQuery, $availableTypes, $availableParams);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'user' => $user,
        'schedules' => $schedules,
        'available_schedules' => $availableSchedules
    ]);
    
} catch (Exception $e) {
    error_log("Error in get_user_details.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>