<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    $conn = getDBConnection();
    
    // Determine doctor_id: query param overrides, otherwise resolve from logged-in user
    $doctor_id = null;
    if (isset($_GET['doctor_id'])) {
        $doctor_id = intval($_GET['doctor_id']);
    } else {
        session_start();
        if (!isset($_SESSION['uid'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Not authenticated']);
            closeDBConnection($conn);
            exit;
        }
        $user_id = intval($_SESSION['uid']);
        $rows = executeQuery($conn, 'SELECT d.Doctor_id FROM Doctor d JOIN user_account ua ON ua.email = d.Email WHERE ua.user_id = ? LIMIT 1', 'i', [$user_id]);
        if (!is_array($rows) || count($rows) === 0) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'No doctor associated with user']);
            closeDBConnection($conn);
            exit;
        }
        $doctor_id = (int)$rows[0]['Doctor_id'];
    }
    
    // Get doctor's work schedule with office locations
    $sql = "SELECT 
                ws.Day_of_week,
                ws.Start_time,
                ws.End_time,
                o.Office_ID,
                o.Name as office_name,
                o.address,
                o.City,
                o.State
            FROM WorkSchedule ws
            JOIN Office o ON ws.Office_id = o.Office_ID
            WHERE ws.Doctor_id = ?
            ORDER BY 
                FIELD(ws.Day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')";
    
    $schedule = executeQuery($conn, $sql, 'i', [$doctor_id]);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'doctor_id' => $doctor_id,
        'schedule' => $schedule
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>