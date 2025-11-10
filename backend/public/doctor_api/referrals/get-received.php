<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    $conn = getDBConnection();
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
        $rows = executeQuery($conn, 'SELECT d.doctor_id 
            FROM user_account ua
            JOIN staff s ON ua.user_id = s.staff_id
            JOIN doctor d ON s.staff_id = d.staff_id
            WHERE ua.user_id = ? 
            LIMIT 1
            ', 'i', [$user_id]);
        if (!is_array($rows) || count($rows) === 0) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'No doctor associated with user']);
            closeDBConnection($conn);
            exit;
        }
        $doctor_id = (int)$rows[0]['doctor_id'];
    }
    
    $sql = "SELECT 
                r.referral_id,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                p.patient_id,
                CONCAT(st.first_name, ' ', st.last_name) as specialist_name,
                s.specialty_name,
                r.reason,
                r.date_of_approval
            FROM referral r
            INNER JOIN patient p ON r.patient_id = p.patient_id
            LEFT JOIN staff st ON r.specialist_doctor_staff_id = st.staff_id
            LEFT JOIN doctor d2 ON st.staff_id = d2.staff_id
            LEFT JOIN specialty s ON d2.specialty = s.specialty_id
            WHERE r.specialist_doctor_staff_id = ?
            ORDER BY r.referral_id DESC";

    $results = executeQuery($conn, $sql, 'i', [$doctor_id]);
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'referrals' => $results,
        'count' => count($results)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
