<?php
/**
 * Save/update clinical note in patient_visit.treatment field
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
    
    // Get doctor info
    $conn = getDBConnection();
    $rows = executeQuery($conn, '
        SELECT d.doctor_id, CONCAT(d.first_name, " ", d.last_name) as doctor_name
        FROM doctor d
        JOIN user_account ua ON ua.email = d.email
        WHERE ua.user_id = ?', 'i', [$user_id]);
    
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No doctor account found']);
        exit;
    }
    
    $doctor_id = (int)$rows[0]['doctor_id'];
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
            'SELECT visit_id FROM patient_visit WHERE appointment_id = ? LIMIT 1', 
            'i', [$appointment_id]);
        
        if (!empty($visitRows)) {
            $visit_id = (int)$visitRows[0]['visit_id'];
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
    
    // Update the treatment field in patient_visit (all lowercase)
    $sql = "UPDATE patient_visit 
            SET treatment = ?,
                diagnosis = COALESCE(?, diagnosis),
                last_updated = NOW(),
                updated_by = ?
            WHERE visit_id = ?";
    
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