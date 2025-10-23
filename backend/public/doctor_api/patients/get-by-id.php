<?php
/**
 * Get patient by id
 * Accepts `patient_id` (numeric) or `id` like 'P001'
 */

require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    $conn = getDBConnection();

    $raw = isset($_GET['patient_id']) ? $_GET['patient_id'] : (isset($_GET['id']) ? $_GET['id'] : null);
    if (!$raw) {
        throw new Exception('patient_id or id required');
    }

    // Allow formats like 'P001' or '001' or numeric
    $numeric = intval(preg_replace('/[^0-9]/', '', $raw));
    if ($numeric <= 0) throw new Exception('Invalid patient id');

    $sql = "SELECT 
                p.Patient_ID,
                p.First_Name,
                p.Last_Name,
                p.dob,
                p.Email,
                p.EmergencyContact,
                p.BloodType,
                ca.Allergies_Text as allergies,
                cg.Gender_Text as gender
            FROM Patient p
            LEFT JOIN CodesAllergies ca ON p.Allergies = ca.AllergiesCode
            LEFT JOIN CodesGender cg ON p.Gender = cg.GenderCode
            WHERE p.Patient_ID = ?
            LIMIT 1";

    $rows = executeQuery($conn, $sql, 'i', [$numeric]);
    if (count($rows) === 0) {
        closeDBConnection($conn);
        echo json_encode(['success' => false, 'error' => 'Patient not found']);
        exit;
    }

    $p = $rows[0];
    $dob = new DateTime($p['dob']);
    $now = new DateTime();
    $age = $now->diff($dob)->y;

    $patient = [
        'id' => 'P' . str_pad($p['Patient_ID'], 3, '0', STR_PAD_LEFT),
        'name' => $p['First_Name'] . ' ' . $p['Last_Name'],
        'dob' => $p['dob'],
        'age' => $age,
        'gender' => $p['gender'] ?: 'Not Specified',
        'email' => $p['Email'] ?: 'No email',
        'phone' => $p['EmergencyContact'] ?: 'No phone',
        'allergies' => $p['allergies'] ?: 'No Known Allergies',
        'bloodType' => $p['BloodType'] ?: 'Unknown',
        'medicalHistory' => [],
        'currentMedications' => []
    ];

    closeDBConnection($conn);
    echo json_encode(['success' => true, 'patient' => $patient]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
