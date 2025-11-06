<?php
/**
    * save-note.php
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

// Set JSON content type header
header('Content-Type: application/json');

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
    
    // Handle appointment IDs - strip "A" prefix if present (e.g., "A1002" -> 1002)
    $appointment_id_raw = isset($input['appointment_id']) ? trim($input['appointment_id']) : '';
    $appointment_id = 0;
    if (!empty($appointment_id_raw)) {
        // Remove "A" prefix if present (case-insensitive)
        $cleaned_id = $appointment_id_raw;
        if (strtoupper(substr($cleaned_id, 0, 1)) === 'A') {
            $cleaned_id = substr($cleaned_id, 1);
        }
        $appointment_id = intval($cleaned_id);
    }
    
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