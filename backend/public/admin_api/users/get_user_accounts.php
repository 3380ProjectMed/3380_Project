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
    
    // Build query based on role filter
    if ($role === 'all' || $role === 'doctor') {
        $query = "SELECT 
                    'doctor' as user_type,
                    d.doctor_id as id,
                    d.first_name,
                    d.last_name,
                    d.email,
                    d.phone,
                    d.ssn,
                    d.license_number,
                    cg.gender_text as gender,
                    d.gender as gender_id,
                    sp.specialty_name as specialization,
                    d.specialty,
                    NULL as department,
                    o.name as work_location_name,
                    d.work_location as work_location_id,
                    o.address as work_location_address,
                    d.work_schedule,
                    COALESCE(u.is_active, 0) as is_active
                FROM doctor d
                LEFT JOIN user_account u ON d.email = u.email
                LEFT JOIN codes_gender cg ON d.gender = cg.gender_code
                LEFT JOIN specialty sp ON d.specialty = sp.specialty_id
                LEFT JOIN office o ON d.work_location = o.office_id
                WHERE 1=1";
        
        // Apply filters for doctors
        if ($active_status !== 'all') {
            $is_active = ($active_status === 'active') ? 1 : 0;
            $query .= " AND COALESCE(u.is_active, 0) = $is_active";
        }
        
        if ($work_location !== 'all') {
            $query .= " AND d.work_location = " . intval($work_location);
        }
        
        $doctors = executeQuery($conn, $query);
        $users = array_merge($users, $doctors);
    }
    
    if ($role === 'all' || $role === 'nurse') {
        $query = "SELECT 
                    'nurse' as user_type,
                    n.nurse_id as id,
                    s.first_name,
                    s.last_name,
                    s.staff_email as email,
                    NULL as phone,
                    s.ssn,
                    s.license_number,
                    cg.gender_text as gender,
                    s.gender as gender_id,
                    NULL as specialization,
                    NULL as specialty,
                    n.department,
                    o.name as work_location_name,
                    s.work_location as work_location_id,
                    o.address as work_location_address,
                    s.work_schedule,
                    COALESCE(u.is_active, 0) as is_active
                FROM nurse n
                INNER JOIN staff s ON n.staff_id = s.staff_id
                LEFT JOIN user_account u ON s.staff_email = u.email
                LEFT JOIN codes_gender cg ON s.gender = cg.gender_code
                LEFT JOIN office o ON s.work_location = o.office_id
                WHERE s.staff_role = 'Nurse'";
        
        // Apply filters for nurses
        if ($active_status !== 'all') {
            $is_active = ($active_status === 'active') ? 1 : 0;
            $query .= " AND COALESCE(u.is_active, 0) = $is_active";
        }
        
        if ($work_location !== 'all') {
            $query .= " AND s.work_location = " . intval($work_location);
        }
        
        if ($department !== 'all') {
            $query .= " AND n.department = '" . $conn->real_escape_string($department) . "'";
        }
        
        $nurses = executeQuery($conn, $query);
        $users = array_merge($users, $nurses);
    }
    
    if ($role === 'all' || $role === 'receptionist') {
        $query = "SELECT 
                    'receptionist' as user_type,
                    s.staff_id as id,
                    s.first_name,
                    s.last_name,
                    s.staff_email as email,
                    NULL as phone,
                    s.ssn,
                    s.license_number,
                    cg.gender_text as gender,
                    s.gender as gender_id,
                    NULL as specialization,
                    NULL as specialty,
                    NULL as department,
                    o.name as work_location_name,
                    s.work_location as work_location_id,
                    o.address as work_location_address,
                    s.work_schedule,
                    COALESCE(u.is_active, 0) as is_active
                FROM staff s
                LEFT JOIN user_account u ON s.staff_email = u.email
                LEFT JOIN codes_gender cg ON s.gender = cg.gender_code
                LEFT JOIN office o ON s.work_location = o.office_id
                WHERE s.staff_role = 'Receptionist'";
        
        // Apply filters for receptionists
        if ($active_status !== 'all') {
            $is_active = ($active_status === 'active') ? 1 : 0;
            $query .= " AND COALESCE(u.is_active, 0) = $is_active";
        }
        
        if ($work_location !== 'all') {
            $query .= " AND s.work_location = " . intval($work_location);
        }
        
        $receptionists = executeQuery($conn, $query);
        $users = array_merge($users, $receptionists);
    }
    
    if ($role === 'all' || $role === 'patient') {
        $query = "SELECT 
                    'patient' as user_type,
                    p.patient_id as id,
                    p.first_name,
                    p.last_name,
                    p.email,
                    p.ssn,
                    NULL as license_number,
                    cg.gender_text as gender,
                    p.gender as gender_id,
                    NULL as specialization,
                    NULL as specialty,
                    NULL as department,
                    NULL as work_location_name,
                    NULL as work_location_id,
                    NULL as work_location_address,
                    NULL as work_schedule,
                    p.date_of_birth,
                    p.insurance_company,
                    COALESCE(u.is_active, 0) as is_active
                FROM patient p
                LEFT JOIN user_account u ON p.email = u.email
                LEFT JOIN codes_gender cg ON p.gender = cg.gender_code
                WHERE 1=1";
        
        // Apply filters for patients
        if ($active_status !== 'all') {
            $is_active = ($active_status === 'active') ? 1 : 0;
            $query .= " AND COALESCE(u.is_active, 0) = $is_active";
        }
        
        $patients = executeQuery($conn, $query);
        $users = array_merge($users, $patients);
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