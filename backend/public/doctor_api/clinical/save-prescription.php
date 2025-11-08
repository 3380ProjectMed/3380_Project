<?php
/**
 * Save or update a prescription
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

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
        SELECT s.staff_id 
        FROM staff s
        JOIN user_account ua ON ua.email = s.email
        WHERE ua.user_id = ?', 'i', [$user_id]);
    
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied - doctors only']);
        exit;
    }
    
    $doctor_id = (int)$rows[0]['doctor_id'];
    
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    $prescription_id = isset($input['prescription_id']) ? intval($input['prescription_id']) : 0;
    $patient_id = isset($input['patient_id']) ? intval($input['patient_id']) : 0;
    $appointment_id = isset($input['appointment_id']) ? intval($input['appointment_id']) : null;
    $medication_name = isset($input['medication_name']) ? trim($input['medication_name']) : '';
    $dosage = isset($input['dosage']) ? trim($input['dosage']) : '';
    $frequency = isset($input['frequency']) ? trim($input['frequency']) : '';
    $route = isset($input['route']) ? trim($input['route']) : '';
    $start_date = isset($input['start_date']) ? $input['start_date'] : date('Y-m-d');
    $end_date = isset($input['end_date']) ? $input['end_date'] : null;
    $refills_allowed = isset($input['refills_allowed']) ? intval($input['refills_allowed']) : 0;
    $notes = isset($input['notes']) ? trim($input['notes']) : '';
    
    if ($patient_id === 0) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'patient_id required']);
        exit;
    }
    
    if (empty($medication_name)) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'medication_name required']);
        exit;
    }
    
    if ($prescription_id > 0) {
        // UPDATE existing prescription
        $sql = "UPDATE prescription 
                SET medication_name = ?,
                    dosage = ?,
                    frequency = ?,
                    route = ?,
                    start_date = ?,
                    end_date = ?,
                    refills_allowed = ?,
                    notes = ?
                WHERE prescription_id = ? AND doctor_id = ?";
        
        executeQuery($conn, $sql, 'ssssssisis', [
            $medication_name,
            $dosage,
            $frequency,
            $route,
            $start_date,
            $end_date,
            $refills_allowed,
            $notes,
            $prescription_id,
            $doctor_id
        ]);
        
        $message = 'Prescription updated successfully';
        
    } else {
        // INSERT new prescription
        $sql = "INSERT INTO prescription 
                (patient_id, doctor_id, appointment_id, medication_name, dosage, frequency, route, start_date, end_date, refills_allowed, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        executeQuery($conn, $sql, 'iiissssssis', [
            $patient_id,
            $doctor_id,
            $appointment_id,
            $medication_name,
            $dosage,
            $frequency,
            $route,
            $start_date,
            $end_date,
            $refills_allowed,
            $notes
        ]);
        
        $prescription_id = $conn->insert_id;
        $message = 'Prescription created successfully';
    }
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'message' => $message,
        'prescription_id' => $prescription_id
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>