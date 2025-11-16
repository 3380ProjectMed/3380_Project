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
    $query = "SELECT 
                ua.user_id,
                ua.email,
                ua.is_active,
                s.staff_id,
                s.first_name,
                s.last_name,
                CONCAT(s.first_name, ' ', s.last_name) as name,
                s.gender,
                s.license_number,
                s.phone_number";

    if ($userType === 'DOCTOR') {
        $query .= ", sp.specialty_name as specialty";
    } elseif ($userType === 'NURSE') {
        $query .= ", n.department";
    }

    $query .= "
        FROM user_account ua
        JOIN staff s ON ua.user_id = s.staff_id";

    if ($userType === 'DOCTOR') {
        $query .= " 
            LEFT JOIN doctor d ON s.staff_id = d.staff_id
            LEFT JOIN specialty sp ON d.specialty = sp.specialty_id";
    } elseif ($userType === 'NURSE') {
        $query .= " LEFT JOIN nurse n ON s.staff_id = n.staff_id";
    }

    $query .= " WHERE ua.user_id = ? AND ua.role = ?";

    $userResults = executeQuery($conn, $query, 'is', [$userId, $userType]);

    if (empty($userResults)) {
        echo json_encode(['success' => false, 'error' => 'User not found']);
        closeDBConnection($conn);
        exit;
    }

    $user = $userResults[0];

    // Get work locations from work_schedule (staff can work at multiple locations)
    $locationsQuery = "SELECT DISTINCT 
                            o.office_id,
                            o.name as office_name,
                            o.address as office_address
                        FROM work_schedule ws
                        JOIN office o ON ws.office_id = o.office_id
                        WHERE ws.staff_id = ?
                        ORDER BY o.name";

    $locations = executeQuery($conn, $locationsQuery, 'i', [$user['staff_id']]);

    // Format work locations
    if (!empty($locations)) {
        // Use the first location as primary
        $user['office_id'] = $locations[0]['office_id'];
        $user['work_location'] = $locations[0]['office_name'];
        $user['office_address'] = $locations[0]['office_address'];

        // If there are multiple locations, concatenate them
        if (count($locations) > 1) {
            $user['work_location'] = implode(', ', array_column($locations, 'office_name'));
            $user['all_locations'] = $locations; // Include all for detailed view
        }
    } else {
        // No work locations assigned yet
        $user['office_id'] = null;
        $user['work_location'] = 'Not assigned';
        $user['office_address'] = 'N/A';
        $user['all_locations'] = [];
    }

    // Get assigned schedules for this staff member
    $schedulesQuery = "SELECT 
                            ws.schedule_id, 
                            ws.day_of_week, 
                            ws.start_time, 
                            ws.end_time,
                            o.name as office_name,
                            o.office_id
                        FROM work_schedule ws
                        LEFT JOIN office o ON ws.office_id = o.office_id
                        WHERE ws.staff_id = ?
                        ORDER BY 
                            CASE ws.day_of_week
                                WHEN 'Monday' THEN 1
                                WHEN 'Tuesday' THEN 2
                                WHEN 'Wednesday' THEN 3
                                WHEN 'Thursday' THEN 4
                                WHEN 'Friday' THEN 5
                                WHEN 'Saturday' THEN 6
                                WHEN 'Sunday' THEN 7
                            END";

    $schedules = executeQuery($conn, $schedulesQuery, 'i', [$user['staff_id']]);

    // Get available template schedules from ALL offices where this staff member doesn't have a schedule yet
    // Build a list of day+office combinations that are already assigned
    $assignedCombos = [];
    foreach ($schedules as $schedule) {
        $assignedCombos[] = $schedule['day_of_week'] . '_' . $schedule['office_id'];
    }

    // Get available schedules from all offices
    $availableQuery = "SELECT DISTINCT 
                            ws.day_of_week, 
                            ws.start_time, 
                            ws.end_time,
                            o.office_id,
                            o.name as office_name
                        FROM work_schedule ws
                        JOIN office o ON ws.office_id = o.office_id
                        WHERE ws.staff_id IS NULL";

    $availableSchedules = executeQuery($conn, $availableQuery);

    // Filter out already assigned day+office combinations
    $filteredAvailable = array_filter($availableSchedules, function ($schedule) use ($assignedCombos) {
        $combo = $schedule['day_of_week'] . '_' . $schedule['office_id'];
        return !in_array($combo, $assignedCombos);
    });

    // Sort available schedules
    usort($filteredAvailable, function ($a, $b) {
        $dayOrder = [
            'Monday' => 1,
            'Tuesday' => 2,
            'Wednesday' => 3,
            'Thursday' => 4,
            'Friday' => 5,
            'Saturday' => 6,
            'Sunday' => 7
        ];

        $aDay = $dayOrder[$a['day_of_week']] ?? 8;
        $bDay = $dayOrder[$b['day_of_week']] ?? 8;

        if ($aDay !== $bDay) {
            return $aDay - $bDay;
        }

        return strcmp($a['office_name'], $b['office_name']);
    });

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'user' => $user,
        'schedules' => $schedules,
        'available_schedules' => array_values($filteredAvailable)
    ]);
} catch (Exception $e) {
    error_log("Error in get_user_details.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
