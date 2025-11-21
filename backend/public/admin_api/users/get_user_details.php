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

    $userId   = $_GET['user_id']   ?? null;
    $userType = $_GET['user_type'] ?? null;

    if (!$userId || !$userType) {
        echo json_encode(['success' => false, 'error' => 'Missing parameters']);
        exit;
    }

    $conn = getDBConnection();

    $userType = strtoupper($userType);

    $query = "SELECT 
                ua.user_id,
                ua.email,
                ua.is_active,
                s.staff_id,
                s.first_name,
                s.last_name,
                CONCAT(s.first_name, ' ', s.last_name) AS name,
                s.gender,
                s.license_number,
                s.staff_role";

    if ($userType === 'DOCTOR') {
        $query .= ", sp.specialty_name AS specialty";
    } elseif ($userType === 'NURSE') {
        $query .= ", n.department";
    }

    $query .= "
        FROM user_account ua
        JOIN staff s ON ua.user_id = s.staff_id";

    if ($userType === 'DOCTOR') {
        $query .= "
            LEFT JOIN doctor d   ON s.staff_id = d.staff_id
            LEFT JOIN specialty sp ON d.specialty = sp.specialty_id";
    } elseif ($userType === 'NURSE') {
        $query .= " 
            LEFT JOIN nurse n ON s.staff_id = n.staff_id";
    }

    $query .= " 
        WHERE ua.user_id = ? 
          AND ua.role = ?";

    $userResults = executeQuery($conn, $query, 'is', [$userId, $userType]);

    if (empty($userResults)) {
        echo json_encode(['success' => false, 'error' => 'User not found']);
        closeDBConnection($conn);
        exit;
    }

    $user = $userResults[0];

    $locationsQuery = "SELECT DISTINCT 
                            o.office_id,
                            o.name   AS office_name,
                            o.address AS office_address
                        FROM work_schedule ws
                        JOIN office o ON ws.office_id = o.office_id
                        WHERE ws.staff_id = ?
                        ORDER BY o.name";

    $locations = executeQuery($conn, $locationsQuery, 'i', [$user['staff_id']]);

    if (!empty($locations)) {
        $user['office_id']      = $locations[0]['office_id'];
        $user['work_location']  = $locations[0]['office_name'];
        $user['office_address'] = $locations[0]['office_address'];

        if (count($locations) > 1) {
            $user['work_location'] = implode(', ', array_column($locations, 'office_name'));
            $user['all_locations'] = $locations;
        } else {
            $user['all_locations'] = $locations;
        }
    } else {
        $user['office_id']      = null;
        $user['work_location']  = 'Not assigned';
        $user['office_address'] = 'N/A';
        $user['all_locations']  = [];
    }

    $schedulesQuery = "SELECT 
                            ws.schedule_id, 
                            ws.day_of_week, 
                            ws.start_time, 
                            ws.end_time,
                            o.name      AS office_name,
                            o.office_id
                        FROM work_schedule ws
                        LEFT JOIN office o ON ws.office_id = o.office_id
                        WHERE ws.staff_id = ?
                        ORDER BY 
                            CASE ws.day_of_week
                                WHEN 'Monday'    THEN 1
                                WHEN 'Tuesday'   THEN 2
                                WHEN 'Wednesday' THEN 3
                                WHEN 'Thursday'  THEN 4
                                WHEN 'Friday'    THEN 5
                                WHEN 'Saturday'  THEN 6
                                WHEN 'Sunday'    THEN 7
                            END";

    $schedules = executeQuery($conn, $schedulesQuery, 'i', [$user['staff_id']]);


    $staffId        = (int)$user['staff_id'];
    $staffRoleUpper = strtoupper($user['staff_role'] ?? '');

    $homeOfficeId = null;
    if (in_array($staffRoleUpper, ['NURSE', 'RECEPTIONIST'], true)) {
        $homeOfficeQuery = "
            SELECT DISTINCT office_id
            FROM work_schedule
            WHERE staff_id = ?
            LIMIT 1
        ";
        $homeOfficeResult = executeQuery($conn, $homeOfficeQuery, 'i', [$staffId]);
        if (!empty($homeOfficeResult)) {
            $homeOfficeId = (int)$homeOfficeResult[0]['office_id'];
        }
    }

    $availableSql = "
        SELECT
            t.office_id,
            o.name       AS office_name,
            t.day_of_week,
            t.start_time,
            t.end_time
        FROM work_schedule_templates t
        INNER JOIN office o
            ON o.office_id = t.office_id
    ";

    $params = [];
    $types  = '';
    $whereClauses = [];

    if (in_array($staffRoleUpper, ['NURSE', 'RECEPTIONIST'], true) && $homeOfficeId !== null) {
        $whereClauses[] = "t.office_id = ?";
        $params[]       = $homeOfficeId;
        $types         .= 'i';
    }

    if (!empty($whereClauses)) {
        $availableSql .= " WHERE " . implode(' AND ', $whereClauses);
    }

    $availableSql .= "
        ORDER BY FIELD(t.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
                 o.name
    ";

    $availableSchedules = executeQuery(
        $conn,
        $types === '' ? $availableSql : $availableSql,
        $types === '' ? null : $types,
        $types === '' ? []   : $params
    );



    closeDBConnection($conn);

    echo json_encode([
        'success'             => true,
        'user'                => $user,
        'schedules'           => $schedules,
        'available_schedules' => $availableSchedules
    ]);
} catch (Exception $e) {
    error_log("Error in get_user_details.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Database error: ' . $e->getMessage()
    ]);
}
