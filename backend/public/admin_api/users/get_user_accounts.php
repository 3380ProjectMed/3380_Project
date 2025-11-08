<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    session_start();
    
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
                        ua.user_id,
                        ua.role as user_type,
                        CONCAT(d.first_name, ' ', d.last_name) as name,
                        ua.email,
                        d.ssn,
                        CAST(d.specialty AS CHAR) as specialization_dept,
                        o.name as work_location,
                        d.work_location as work_location_id,
                        ua.status,
                        ua.is_active
                    FROM user_account ua
                    INNER JOIN doctor d ON ua.email = d.email
                    LEFT JOIN office o ON d.work_location = o.office_id
                    WHERE ua.role = 'DOCTOR'";
            
            if ($active_status !== 'all') {
                $is_active = ($active_status === 'active') ? 1 : 0;
                $doctor_query .= " AND ua.is_active = $is_active";
            }
            
            if ($work_location !== 'all') {
                $doctor_query .= " AND d.work_location = " . intval($work_location);
            }
            
            $queries[] = $doctor_query;
        }
        
        // NURSES query
        if ($role === 'all' || $role === 'nurse') {
            $nurse_query = "SELECT 
                        ua.user_id,
                        ua.role as user_type,
                        CONCAT(s.first_name, ' ', s.last_name) as name,
                        ua.email,
                        s.ssn,
                        n.department as specialization_dept,
                        o.name as work_location,
                        s.work_location as work_location_id,
                        ua.status,
                        ua.is_active
                    FROM user_account ua
                    INNER JOIN staff s ON ua.email = s.staff_email
                    INNER JOIN nurse n ON s.staff_id = n.staff_id
                    LEFT JOIN office o ON s.work_location = o.office_id
                    WHERE ua.role = 'NURSE' AND s.staff_role = 'Nurse'";
            
            if ($active_status !== 'all') {
                $is_active = ($active_status === 'active') ? 1 : 0;
                $nurse_query .= " AND ua.is_active = $is_active";
            }
            
            if ($work_location !== 'all') {
                $nurse_query .= " AND s.work_location = " . intval($work_location);
            }
            
            if ($department !== 'all') {
                $nurse_query .= " AND n.department = '" . $conn->real_escape_string($department) . "'";
            }
            
            $queries[] = $nurse_query;
        }
        
        // RECEPTIONISTS query
        if ($role === 'all' || $role === 'receptionist') {
            $receptionist_query = "SELECT 
                        ua.user_id,
                        ua.role as user_type,
                        CONCAT(s.first_name, ' ', s.last_name) as name,
                        ua.email,
                        s.ssn,
                        NULL as specialization_dept,
                        o.name as work_location,
                        s.work_location as work_location_id,
                        ua.status,
                        ua.is_active
                    FROM user_account ua
                    INNER JOIN staff s ON ua.email = s.staff_email
                    LEFT JOIN office o ON s.work_location = o.office_id
                    WHERE ua.role = 'RECEPTIONIST' AND s.staff_role = 'Receptionist'";
            
            if ($active_status !== 'all') {
                $is_active = ($active_status === 'active') ? 1 : 0;
                $receptionist_query .= " AND ua.is_active = $is_active";
            }
            
            if ($work_location !== 'all') {
                $receptionist_query .= " AND s.work_location = " . intval($work_location);
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
                    ua.status,
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
?>