<?php
header('Content-Type: application/json');
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

if (empty($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'UNAUTHENTICATED']);
    exit;
}

try {
    $conn = getDBConnection();
    $patient_id = $_GET['patient_id'] ?? 0;

    if (!$patient_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'patient_id is required']);
        exit;
    }

    // Get patient allergies from patient table (using existing structure for now)
    // Note: allergies_per_patient table not yet created, so using patient.allergies field
    $patient_allergy_sql = "SELECT 
                            p.allergies as allergies_code,
                            ca.allergies_text
                        FROM patient p
                        LEFT JOIN codes_allergies ca ON p.allergies = ca.allergies_code
                        WHERE p.patient_id = ? AND p.allergies IS NOT NULL";
    
    $patient_allergy = executeQuery($conn, $patient_allergy_sql, 'i', [$patient_id]);

    // Get current medications from prescription table (if exists)
    $medications = [];
    try {
        $medications_sql = "SELECT 
                            p.prescription_id,
                            p.medication_name,
                            p.dosage,
                            p.frequency,
                            p.route,
                            p.start_date,
                            p.end_date,
                            p.notes,
                            p.refills_allowed,
                            CONCAT(s.first_name, ' ', s.last_name) as prescribed_by
                        FROM prescription p
                        LEFT JOIN staff s ON p.doctor_id = s.staff_id
                        WHERE p.patient_id = ? 
                        AND (p.end_date IS NULL OR p.end_date >= CURDATE())
                        ORDER BY p.start_date DESC";
        
        $medications = executeQuery($conn, $medications_sql, 'i', [$patient_id]);
    } catch (Exception $e) {
        error_log("Prescription table query failed: " . $e->getMessage());
        $medications = [];
    }

    // Also get medication history (if exists)
    $medication_history = [];
    try {
        $med_history_sql = "SELECT 
                            mh.drug_id,
                            mh.drug_name,
                            mh.duration_and_frequency_of_drug_use as frequency
                        FROM medication_history mh
                        WHERE mh.patient_id = ?
                        ORDER BY mh.drug_id DESC";
        
        $medication_history = executeQuery($conn, $med_history_sql, 'i', [$patient_id]);
    } catch (Exception $e) {
        error_log("Medication history table query failed: " . $e->getMessage());
        $medication_history = [];
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'allergies' => [
            'specific_allergies' => [], // Empty for now until allergies_per_patient table is created
            'general_allergy' => $patient_allergy ?: []
        ],
        'medications' => [
            'current_prescriptions' => $medications ?: [],
            'medication_history' => $medication_history ?: []
        ]
    ]);

} catch (Exception $e) {
    if (isset($conn)) closeDBConnection($conn);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>