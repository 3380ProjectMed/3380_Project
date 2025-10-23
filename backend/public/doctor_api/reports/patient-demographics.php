<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    $conn = getDBConnection();
    $doctor_id = null;
    if (isset($_GET['doctor_id'])) {
        $doctor_id = intval($_GET['doctor_id']);
    } else {
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
    
    $sql = "SELECT 
                p.Patient_ID,
                CONCAT(p.First_Name, ' ', p.Last_Name) as patient_name,
                p.dob,
                TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) as age,
                cg.Gender_Text as gender,
                cr.Race_Text as race,
                ce.Ethnicity_Text as ethnicity,
                ca.Allergies_Text as allergies,
                p.BloodType,
                ip.plan_name as insurance,
                CONCAT(d.First_Name, ' ', d.Last_Name) as primary_doctor
            FROM Patient p
            LEFT JOIN CodesGender cg ON p.Gender = cg.GenderCode
            LEFT JOIN CodesRace cr ON p.Race = cr.RaceCode
            LEFT JOIN CodesEthnicity ce ON p.Ethnicity = ce.EthnicityCode
            LEFT JOIN CodesAllergies ca ON p.Allergies = ca.AllergiesCode
            LEFT JOIN Doctor d ON p.Primary_Doctor = d.Doctor_id
            LEFT JOIN patient_insurance pi ON p.InsuranceID = pi.id
            LEFT JOIN insurance_plan ip ON pi.plan_id = ip.plan_id
            WHERE p.Primary_Doctor = ?
            ORDER BY p.Last_Name, p.First_Name";
    
    $results = executeQuery($conn, $sql, 'i', [$doctor_id]);
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'reportTitle' => 'Patient Demographics Report',
        'reportDate' => date('Y-m-d H:i:s'),
        'data' => $results,
        'count' => count($results)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>