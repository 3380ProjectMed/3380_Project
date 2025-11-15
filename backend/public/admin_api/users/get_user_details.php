<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'ADMIN') {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

require_once '../../config/database.php';

$userId = $_GET['user_id'] ?? null;
$userType = $_GET['user_type'] ?? null;

if (!$userId || !$userType) {
    echo json_encode(['success' => false, 'error' => 'Missing parameters']);
    exit;
}

try {
    $db = new Database();
    $conn = $db->getConnection();
    
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
    
    if (strtoupper($userType) === 'DOCTOR') {
        $query .= ", d.specialty";
    } elseif (strtoupper($userType) === 'NURSE') {
        $query .= ", n.department";
    }
    
    $query .= "
        FROM UserAccount ua
        JOIN Staff s ON ua.user_id = s.user_id
        LEFT JOIN Office o ON s.office_id = o.office_id
        LEFT JOIN WorkSchedule ws ON s.schedule_id = ws.schedule_id";
    
    if (strtoupper($userType) === 'DOCTOR') {
        $query .= " LEFT JOIN Doctor d ON s.staff_id = d.staff_id";
    } elseif (strtoupper($userType) === 'NURSE') {
        $query .= " LEFT JOIN Nurse n ON s.staff_id = n.staff_id";
    }
    
    $query .= " WHERE ua.user_id = :user_id AND ua.user_type = :user_type";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':user_type', $userType);
    $stmt->execute();
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }
    
    // Get assigned schedules for this staff member
    $schedulesQuery = "
        SELECT schedule_id, day_of_week, start_time, end_time
        FROM WorkSchedule
        WHERE staff_id = :staff_id
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
    
    $schedulesStmt = $conn->prepare($schedulesQuery);
    $schedulesStmt->bindParam(':staff_id', $user['staff_id']);
    $schedulesStmt->execute();
    $schedules = $schedulesStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get available template schedules from the user's office that aren't already assigned
    $assignedDays = array_column($schedules, 'day_of_week');
    
    $availableQuery = "
        SELECT DISTINCT day_of_week, start_time, end_time
        FROM WorkSchedule
        WHERE office_id = :office_id
        AND staff_id IS NULL";
    
    if (!empty($assignedDays)) {
        $placeholders = str_repeat('?,', count($assignedDays) - 1) . '?';
        $availableQuery .= " AND day_of_week NOT IN ($placeholders)";
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
    
    $availableStmt = $conn->prepare($availableQuery);
    $availableStmt->bindParam(':office_id', $user['office_id']);
    
    if (!empty($assignedDays)) {
        foreach ($assignedDays as $index => $day) {
            $availableStmt->bindValue($index + 2, $day);
        }
    }
    
    $availableStmt->execute();
    $availableSchedules = $availableStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'user' => $user,
        'schedules' => $schedules,
        'available_schedules' => $availableSchedules
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in get_user_details.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>