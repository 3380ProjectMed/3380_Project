<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    $patient_id = intval($input['patient_id']);
    $specialist_doctor_id = intval($input['specialist_doctor_id']);
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
        $rows = executeQuery(getDBConnection(), 'SELECT d.Doctor_id FROM Doctor d JOIN user_account ua ON ua.email = d.Email WHERE ua.user_id = ? LIMIT 1', 'i', [$user_id]);
        if (!is_array($rows) || count($rows) === 0) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'No doctor associated with user']);
            exit;
        }
        $referring_doctor_id = (int)$rows[0]['Doctor_id'];
    }
    $reason = isset($input['reason']) ? $input['reason'] : null;
    // NOTE: the Referral table does not have a separate `notes` column in the schema.
    // Use the Reason field to store descriptive text. Ignore any `notes` input to avoid SQL errors.
    
    $conn = getDBConnection();
    
    // Insert referral — store descriptive text in Reason (schema does not include `notes` column)
    $sql = "INSERT INTO Referral 
        (Patient_ID, referring_doctor_staff_id, specialist_doctor_staff_id, Reason, Status)
        VALUES (?, ?, ?, ?, 'Pending')";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('iiis', $patient_id, $referring_doctor_id, $specialist_doctor_id, $reason);
    
    if ($stmt->execute()) {
        $referral_id = $conn->insert_id;
        
        echo json_encode([
            'success' => true,
            'message' => 'Referral created successfully',
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