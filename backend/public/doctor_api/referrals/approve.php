<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
        $referral_id = intval($input['referral_id']);
        $doctor_id = intval($input['doctor_id']); // Doctor approving
        $action = isset($input['action']) ? $input['action'] : null; // 'approve' or 'deny'
    
    $conn = getDBConnection();
    
    // Update referral status
    $status = ($action === 'approve') ? 'Approved' : 'Denied';
    $date = date('Y-m-d');
    
        // Allow the action if the acting doctor is either the referring doctor or the specialist
        $sql = "UPDATE Referral 
                SET Status = ?, Date_of_approval = ?
                WHERE Referral_ID = ?
                AND (referring_doctor_staff_id = ? OR specialist_doctor_staff_id = ?)";
    
    $stmt = $conn->prepare($sql);
        $stmt->bind_param('ssiii', $status, $date, $referral_id, $doctor_id, $doctor_id);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                'success' => true,
                'message' => "Referral {$status} successfully",
                'date_of_approval' => $date
            ]);
        } else {
            throw new Exception('Referral not found or you do not have permission');
        }
    } else {
        throw new Exception('Failed to update referral: ' . $stmt->error);
    }
    
    $stmt->close();
    closeDBConnection($conn);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>