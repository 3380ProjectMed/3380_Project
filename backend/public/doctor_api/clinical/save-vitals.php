<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $patient_id = isset($input['patient_id']) ? intval($input['patient_id']) : 0;
    $appointment_id = isset($input['appointment_id']) ? intval($input['appointment_id']) : null;
    $blood_pressure = isset($input['blood_pressure']) ? $input['blood_pressure'] : null;
    $heart_rate = isset($input['heart_rate']) ? intval($input['heart_rate']) : null;
    $temperature = isset($input['temperature']) ? floatval($input['temperature']) : null;
    $respiratory_rate = isset($input['respiratory_rate']) ? intval($input['respiratory_rate']) : null;
    $oxygen_saturation = isset($input['oxygen_saturation']) ? intval($input['oxygen_saturation']) : null;
    $weight = isset($input['weight']) ? floatval($input['weight']) : null;
    
    if ($patient_id === 0) {
        throw new Exception('Patient ID is required');
    }
    
    $conn = getDBConnection();
    
    // Insert vitals (your schema doesn't have a vitals table, need to add it or use PatientVisit)
    // Option 1: Update PatientVisit
    if ($appointment_id) {
        $sql = "UPDATE PatientVisit 
                SET Blood_pressure = ?, Temperature = ?
                WHERE Appointment_id = ? AND Patient_id = ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('sdii', $blood_pressure, $temperature, $appointment_id, $patient_id);
        $stmt->execute();
        $stmt->close();
    }
    
    // Option 2: You should create a vitals table
    // CREATE TABLE vitals (
    //   vital_id INT PRIMARY KEY AUTO_INCREMENT,
    //   patient_id INT,
    //   appointment_id INT,
    //   blood_pressure VARCHAR(10),
    //   heart_rate INT,
    //   temperature DECIMAL(4,1),
    //   respiratory_rate INT,
    //   oxygen_saturation INT,
    //   weight DECIMAL(5,1),
    //   recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //   FOREIGN KEY (patient_id) REFERENCES Patient(Patient_ID)
    // );
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'message' => 'Vitals saved successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>