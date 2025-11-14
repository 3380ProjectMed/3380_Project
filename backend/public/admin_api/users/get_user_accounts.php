<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    //session_start();

    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    // Get filter parameters
    $role = isset($_GET['role']) ? $_GET['role'] : 'all';
    $active_status = isset($_GET['active_status']) ? $_GET['active_status'] : 'all';
    $work_location = isset($_GET['work_location']) ? $_GET['work_location'] : 'all';
    $department = isset($_GET['department']) ? $_GET['department'] : 'all';

    $conn = getDBConnection();

    $users = [];

    // Build unified query for all staff roles or specific role
    if ($role === 'all' || in_array($role, ['doctor', 'nurse', 'receptionist'])) {
        // Start building the UNION query
        $queries = [];

        // DOCTORS query
        if ($role === 'all' || $role === 'doctor') {
            $doctor_query = "SELECT 
                    d.doctor_id,
                    COALESCE(ua.user_id, CONCAT('NO_ACCOUNT_D', d.doctor_id)) as user_id,
                    COALESCE(ua.role, 'DOCTOR') as user_type,
                    CONCAT(s.first_name, ' ', s.last_name) as name,
                    s.staff_email as email,
                    s.ssn,
                    sp.specialty_name as specialization_dept,
                    o.name as work_location,
                    o.office_id as work_location_id,
                    COALESCE(ua.created_at, NULL) as created_at,
                    COALESCE(ua.is_active, 0) as is_active,
                    CASE WHEN ua.user_id IS NULL THEN 1 ELSE 0 END as no_account
                FROM doctor d
                INNER JOIN staff s ON d.staff_id = s.staff_id
                LEFT JOIN user_account ua ON s.staff_id = ua.user_id AND ua.role = 'DOCTOR'
                LEFT JOIN specialty sp ON d.specialty = sp.specialty_id
                LEFT JOIN work_schedule ws ON s.staff_id = ws.staff_id
                LEFT JOIN office o ON ws.office_id = o.office_id
                WHERE s.staff_role = 'Doctor'";

            if ($active_status !== 'all') {
                if ($active_status === 'active') {
                    $doctor_query .= " AND ua.user_id IS NOT NULL AND ua.is_active = 1";
                } else {
                    $doctor_query .= " AND (ua.is_active = 0 OR ua.user_id IS NULL)";
                }
            }

            if ($work_location !== 'all') {
                $doctor_query .= " AND o.office_id = " . intval($work_location);
            }

            $queries[] = $doctor_query;
        }

        // NURSES query
        if ($role === 'all' || $role === 'nurse') {
            $nurse_query = "SELECT 
                    n.nurse_id,
                    COALESCE(ua.user_id, CONCAT('NO_ACCOUNT_N', n.nurse_id)) as user_id,
                    COALESCE(ua.role, 'NURSE') as user_type,
                    CONCAT(s.first_name, ' ', s.last_name) as name,
                    s.staff_email as email,
                    s.ssn,
                    n.department as specialization_dept,
                    o.name as work_location,
                    o.office_id as work_location_id,
                    COALESCE(ua.created_at, NULL) as created_at,
                    COALESCE(ua.is_active, 0) as is_active,
                    CASE WHEN ua.user_id IS NULL THEN 1 ELSE 0 END as no_account
                FROM nurse n
                INNER JOIN staff s ON n.staff_id = s.staff_id
                LEFT JOIN user_account ua ON s.staff_id = ua.user_id AND ua.role = 'NURSE'
                LEFT JOIN work_schedule ws ON s.staff_id = ws.staff_id
                LEFT JOIN office o ON ws.office_id = o.office_id
                WHERE s.staff_role = 'Nurse'";

            if ($active_status !== 'all') {
                if ($active_status === 'active') {
                    $nurse_query .= " AND ua.user_id IS NOT NULL AND ua.is_active = 1";
                } else {
                    $nurse_query .= " AND (ua.is_active = 0 OR ua.user_id IS NULL)";
                }
            }

            if ($work_location !== 'all') {
                $nurse_query .= " AND o.office_id = " . intval($work_location);
            }

            if ($department !== 'all') {
                $nurse_query .= " AND n.department = '" . $conn->real_escape_string($department) . "'";
            }

            $queries[] = $nurse_query;
        }

        // RECEPTIONISTS query
        if ($role === 'all' || $role === 'receptionist') {
            $receptionist_query = "SELECT 
                    s.staff_id,
                    COALESCE(ua.user_id, CONCAT('NO_ACCOUNT_R', s.staff_id)) as user_id,
                    COALESCE(ua.role, 'RECEPTIONIST') as user_type,
                    CONCAT(s.first_name, ' ', s.last_name) as name,
                    s.staff_email as email,
                    s.ssn,
                    NULL as specialization_dept,
                    o.name as work_location,
                    o.office_id as work_location_id,
                    COALESCE(ua.created_at, NULL) as created_at,
                    COALESCE(ua.is_active, 0) as is_active,
                    CASE WHEN ua.user_id IS NULL THEN 1 ELSE 0 END as no_account
                FROM staff s
                LEFT JOIN user_account ua ON s.staff_id = ua.user_id AND ua.role = 'RECEPTIONIST'
                LEFT JOIN work_schedule ws ON s.staff_id = ws.staff_id
                LEFT JOIN office o ON ws.office_id = o.office_id
                WHERE s.staff_role = 'Receptionist'";

            if ($active_status !== 'all') {
                if ($active_status === 'active') {
                    $receptionist_query .= " AND ua.user_id IS NOT NULL AND ua.is_active = 1";
                } else {
                    $receptionist_query .= " AND (ua.is_active = 0 OR ua.user_id IS NULL)";
                }
            }

            if ($work_location !== 'all') {
                $receptionist_query .= " AND o.office_id = " . intval($work_location);
            }

            $queries[] = $receptionist_query;
        }

        // Combine all queries with UNION ALL
        $query = implode(' UNION ALL ', $queries);
        $query .= " ORDER BY user_type, name";

        $staff_users = executeQuery($conn, $query);
        $users = array_merge($users, $staff_users);
    }

    // Handle patients separately with limited information for privacy
    if ($role === 'all' || $role === 'patient') {
        $query = "SELECT 
                    ua.user_id,
                    'PATIENT' as user_type,
                    'Patient Account' as name,
                    ua.email,
                    '***-**-****' as ssn,
                    NULL as specialization_dept,
                    NULL as work_location,
                    NULL as work_location_id,
                    ua.created_at,
                    ua.is_active
                FROM user_account ua
                WHERE ua.role = 'PATIENT'";

        // Apply active status filter
        if ($active_status !== 'all') {
            $is_active = ($active_status === 'active') ? 1 : 0;
            $query .= " AND ua.is_active = $is_active";
        }

        $query .= " ORDER BY ua.email";

        $patient_users = executeQuery($conn, $query);
        $users = array_merge($users, $patient_users);
    }

    // Get distinct work locations for filter dropdown
    $locations_query = "SELECT DISTINCT office_id, name 
                        FROM office 
                        ORDER BY name";
    $locations = executeQuery($conn, $locations_query);

    // Get distinct departments for filter dropdown
    $departments_query = "SELECT DISTINCT department 
                          FROM nurse 
                          WHERE department IS NOT NULL 
                          ORDER BY department";
    $departments = executeQuery($conn, $departments_query);

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'users' => $users,
        'filters' => [
            'locations' => $locations,
            'departments' => $departments
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
