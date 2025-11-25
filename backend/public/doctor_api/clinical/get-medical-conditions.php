<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

header('Content-Type: application/json');

try {
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $patient_id = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;

    if ($patient_id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid patient_id is required']);
        exit;
    }

    $conn = getDBConnection();

    // Check if patient exists
    $patientCheck = executeQuery($conn, "SELECT patient_id FROM patient WHERE patient_id = ?", 'i', [$patient_id]);
    if (empty($patientCheck)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Patient not found']);
        closeDBConnection($conn);
        exit;
    }

    // Get all medical conditions for the patient
    $sql = "SELECT 
                condition_id,
                patient_id,
                condition_name,
                diagnosis_date,
                created_at,
                created_by,
                last_updated,
                updated_by
            FROM medical_condition 
            WHERE patient_id = ? 
            ORDER BY diagnosis_date DESC, condition_id DESC";

    $conditions = executeQuery($conn, $sql, 'i', [$patient_id]);

    closeDBConnection($conn);

    if (is_array($conditions)) {
        echo json_encode([
            'success' => true,
            'conditions' => array_map(function($c) {
                return [
                    'condition_id' => $c['condition_id'] ?? null,
                    'patient_id' => $c['patient_id'] ?? null,
                    'condition_name' => $c['condition_name'] ?? '',
                    'diagnosis_date' => $c['diagnosis_date'] ?? null,
                    'created_at' => $c['created_at'] ?? null,
                    'created_by' => $c['created_by'] ?? null,
                    'last_updated' => $c['last_updated'] ?? null,
                    'updated_by' => $c['updated_by'] ?? null
                ];
            }, $conditions)
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'conditions' => []
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}