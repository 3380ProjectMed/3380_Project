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

    // Get patient allergies from allergies_per_patient table and codes_allergies
    $allergies_sql = "SELECT 
                        app.app_id,
                        app.allergies_code,
                        ca.allergies_text,
                        app.notes,
                        app.created_at
                    FROM allergies_per_patient app
                    LEFT JOIN codes_allergies ca ON app.allergies_code = ca.allergies_code
                    WHERE app.patient_id = ?
                    ORDER BY app.created_at DESC";
    
    $allergies = executeQuery($conn, $allergies_sql, 'i', [$patient_id]);

    // Also check if patient has general allergy in patient table (fallback)
    $patient_allergy_sql = "SELECT 
                            p.allergies as allergies_code,
                            ca.allergies_text
                        FROM patient p
                        LEFT JOIN codes_allergies ca ON p.allergies = ca.allergies_code
                        WHERE p.patient_id = ? AND p.allergies IS NOT NULL";
    
    $patient_allergy = executeQuery($conn, $patient_allergy_sql, 'i', [$patient_id]);

    // Get current medications from prescription table
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

    // Also get medication history
    $med_history_sql = "SELECT 
                        mh.drug_id,
                        mh.drug_name,
                        mh.duration_and_frequency_of_drug_use as frequency
                    FROM medication_history mh
                    WHERE mh.patient_id = ?
                    ORDER BY mh.drug_id DESC";
    
    $medication_history = executeQuery($conn, $med_history_sql, 'i', [$patient_id]);

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'allergies' => [
            'specific_allergies' => $allergies ?: [],
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