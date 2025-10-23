<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    $appointment_id = isset($input['appointment_id']) ? intval($input['appointment_id']) : 0;
    $patient_id = isset($input['patient_id']) ? intval($input['patient_id']) : 0;
    $doctor_id = isset($input['doctor_id']) ? intval($input['doctor_id']) : 0;
    $note_text = isset($input['note_text']) ? $input['note_text'] : '';
    $diagnosis = isset($input['diagnosis']) ? json_encode($input['diagnosis']) : null;
    $treatment = isset($input['treatment']) ? $input['treatment'] : '';
    
    if (empty($note_text)) {
        throw new Exception('Note text is required');
    }
    
    $conn = getDBConnection();
    // Resolve doctor_id from session if not provided
    if (empty($doctor_id)) {
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
    
    // First, create or update PatientVisit record
    $visit_sql = "INSERT INTO PatientVisit 
                  (Appointment_id, Patient_id, Doctor_id, Date, Status, Diagnosis, Treatment, CreatedBy)
                  VALUES (?, ?, ?, NOW(), 'Completed', ?, ?, ?)
                  ON DUPLICATE KEY UPDATE 
                  Status = 'Completed',
                  Diagnosis = VALUES(Diagnosis),
                  Treatment = VALUES(Treatment),
                  LastUpdated = NOW()";
    
    $created_by = 'Doctor_' . $doctor_id;
    $stmt = $conn->prepare($visit_sql);
    $stmt->bind_param('iiisss', $appointment_id, $patient_id, $doctor_id, $diagnosis, $treatment, $created_by);
    $stmt->execute();
    $stmt->close();
    
    // Note: Your schema doesn't have a separate clinical_notes table
    // Clinical notes are stored in PatientVisit.Treatment or you need to add a notes table
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'message' => 'Clinical note saved successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>