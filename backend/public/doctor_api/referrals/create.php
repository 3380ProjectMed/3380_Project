<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    $patient_id = intval($input['patient_id']);
    $specialist_doctor_id = intval($input['specialist_doctor_id']);
    $reason = isset($input['reason']) ? $input['reason'] : null;
    
    // Determine referring doctor: body overrides, otherwise session user
    if (isset($input['referring_doctor_id']) && intval($input['referring_doctor_id']) > 0) {
        $referring_doctor_id = intval($input['referring_doctor_id']);
    } else {
        session_start();
        if (!isset($_SESSION['uid'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Not authenticated']);
            exit;
        }
        $user_id = intval($_SESSION['uid']);
        $conn = getDBConnection();
        $rows = executeQuery($conn, 'SELECT d.doctor_id 
            FROM user_account ua
            JOIN doctor d ON ua.email = d.email
            WHERE ua.user_id = ? 
            LIMIT 1
            ', 'i', [$user_id]);
        if (!is_array($rows) || count($rows) === 0) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'No doctor associated with user']);
            closeDBConnection($conn);
            exit;
        }
        $referring_doctor_id = (int)$rows[0]['doctor_id'];
    }
    
    $conn = getDBConnection();
    
    // Insert referral - Status is automatically 'Approved' since no approval needed
    $sql = "INSERT INTO referral 
        (patient_id, referring_doctor_staff_id, specialist_doctor_staff_id, reason, date_of_approval)
        VALUES (?, ?, ?, ?, CURDATE())";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('iiis', $patient_id, $referring_doctor_id, $specialist_doctor_id, $reason);
    
    if ($stmt->execute()) {
        $referral_id = $conn->insert_id;
        
        echo json_encode([
            'success' => true,
            'message' => 'Referral sent to specialist successfully',
            'referral_id' => $referral_id
        ]);
    } else {
        throw new Exception('Failed to create referral: ' . $stmt->error);
    }
    
    $stmt->close();
    closeDBConnection($conn);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>