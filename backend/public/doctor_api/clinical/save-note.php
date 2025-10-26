<?php
/**
 * Save/update clinical note in PatientVisit.Treatment field
 */
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $user_id = (int)$_SESSION['uid'];
    
    // Get doctor info from session
    $conn = getDBConnection();
    $rows = executeQuery($conn, '
        SELECT d.Doctor_id, CONCAT(d.First_Name, " ", d.Last_Name) as doctor_name
        FROM Doctor d
        JOIN user_account ua ON ua.email = d.Email
        WHERE ua.user_id = ?', 'i', [$user_id]);
    
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No doctor account found']);
        exit;
    }
    
    $doctor_id = (int)$rows[0]['Doctor_id'];
    $doctor_name = $rows[0]['doctor_name'];
    
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    $visit_id = isset($input['visit_id']) ? intval($input['visit_id']) : 0;
    $appointment_id = isset($input['appointment_id']) ? intval($input['appointment_id']) : 0;
    $note_text = isset($input['note_text']) ? trim($input['note_text']) : '';
    $diagnosis = isset($input['diagnosis']) ? trim($input['diagnosis']) : null;
    
    if ($visit_id === 0 && $appointment_id === 0) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'visit_id or appointment_id required']);
        exit;
    }
    
    if (empty($note_text)) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Note text cannot be empty']);
        exit;
    }
    
    // If we have appointment_id, find the visit
    if ($visit_id === 0 && $appointment_id > 0) {
        $visitRows = executeQuery($conn, 
            'SELECT Visit_id FROM PatientVisit WHERE Appointment_id = ? LIMIT 1', 
            'i', [$appointment_id]);
        
        if (!empty($visitRows)) {
            $visit_id = (int)$visitRows[0]['Visit_id'];
        } else {
            closeDBConnection($conn);
            http_response_code(404);
            echo json_encode([
                'success' => false, 
                'error' => 'No visit found for this appointment. Patient must check in first.'
            ]);
            exit;
        }
    }
    
    // Update the Treatment field in PatientVisit
    $sql = "UPDATE PatientVisit 
            SET Treatment = ?,
                Diagnosis = COALESCE(?, Diagnosis),
                LastUpdated = NOW(),
                UpdatedBy = ?
            WHERE Visit_id = ?";
    
    executeQuery($conn, $sql, 'sssi', [$note_text, $diagnosis, $doctor_name, $visit_id]);
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'message' => 'Clinical note saved successfully',
        'visit_id' => $visit_id
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>