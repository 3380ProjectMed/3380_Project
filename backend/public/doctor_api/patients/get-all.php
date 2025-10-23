<?php
/**
 * Get all patients for a doctor
 * Matches YOUR database schema
 */

require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    $conn = getDBConnection();
    
    // Determine doctor_id: query param overrides, otherwise resolve from logged-in user
    $doctor_id = null;
    if (isset($_GET['doctor_id'])) {
        $doctor_id = intval($_GET['doctor_id']);
    } else {
        // Require session and resolve
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
    
    // SQL query matching YOUR schema
    $sql = "SELECT 
                p.Patient_ID,
                p.First_Name,
                p.Last_Name,
                p.dob,
                p.Email,
                p.EmergencyContact,
                p.BloodType,
                ca.Allergies_Text as allergies,
                cg.Gender_Text as gender,
                MAX(a.Appointment_date) as last_visit,
                MIN(CASE WHEN a.Appointment_date > NOW() THEN a.Appointment_date END) as next_appointment
            FROM Patient p
            LEFT JOIN CodesAllergies ca ON p.Allergies = ca.AllergiesCode
            LEFT JOIN CodesGender cg ON p.Gender = cg.GenderCode
            LEFT JOIN Appointment a ON p.Patient_ID = a.Patient_id
            WHERE p.Primary_Doctor = ?
            GROUP BY p.Patient_ID
            ORDER BY p.Last_Name, p.First_Name";
    
    $patients = executeQuery($conn, $sql, 'i', [$doctor_id]);
    
    // Format response
    $formatted_patients = [];
    foreach ($patients as $patient) {
        // Calculate age
        $dob = new DateTime($patient['dob']);
        $now = new DateTime();
        $age = $now->diff($dob)->y;
        
        $formatted_patients[] = [
            'id' => 'P' . str_pad($patient['Patient_ID'], 3, '0', STR_PAD_LEFT),
            'name' => $patient['First_Name'] . ' ' . $patient['Last_Name'],
            'dob' => $patient['dob'],
            'age' => $age,
            'gender' => $patient['gender'] ?: 'Not Specified',
            'email' => $patient['Email'] ?: 'No email',
            'phone' => $patient['EmergencyContact'] ?: 'No phone',
            'allergies' => $patient['allergies'] ?: 'No Known Allergies',
            'bloodType' => $patient['BloodType'] ?: 'Unknown',
            'lastVisit' => $patient['last_visit'] ? date('Y-m-d', strtotime($patient['last_visit'])) : 'No visits yet',
            'nextAppointment' => $patient['next_appointment'] ? date('Y-m-d', strtotime($patient['next_appointment'])) : 'None scheduled',
            'chronicConditions' => [], // Can add JOIN to MedicalCondition table
            'currentMedications' => []  // Can add JOIN to Prescription table
        ];
    }
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'patients' => $formatted_patients,
        'count' => count($formatted_patients)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>