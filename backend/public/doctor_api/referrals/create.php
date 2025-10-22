<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    $patient_id = intval($input['patient_id']);
    $referring_doctor_id = intval($input['referring_doctor_id']);
    $specialist_doctor_id = intval($input['specialist_doctor_id']);
    $reason = isset($input['reason']) ? $input['reason'] : null;
    $notes = isset($input['notes']) ? $input['notes'] : null;
    
    $conn = getDBConnection();
    
    // Insert referral
    $sql = "INSERT INTO Referral 
        (Patient_ID, referring_doctor_staff_id, specialist_doctor_staff_id, Reason, notes, Status)
        VALUES (?, ?, ?, ?, ?, 'Pending')";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('iiiss', $patient_id, $referring_doctor_id, $specialist_doctor_id, $reason, $notes);
    
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