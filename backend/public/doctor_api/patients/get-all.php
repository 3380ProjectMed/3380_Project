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
            'chronicConditions' => [], // will be populated below
            'currentMedications' => []  // will be populated below
        ];
    }

    // Enrich each patient with chronic conditions and current medications (non-fatal)
    foreach ($formatted_patients as $idx => $fp) {
        // extract numeric id
        $rawId = isset($fp['id']) ? intval(preg_replace('/[^0-9]/', '', $fp['id'])) : 0;
        if ($rawId <= 0) continue;

        try {
            $mc_sql = "SELECT Condition_name FROM MedicalCondition WHERE Patient_id = ? ORDER BY Diagnosis_date DESC";
            $mcs = executeQuery($conn, $mc_sql, 'i', [$rawId]);
            if (is_array($mcs)) {
                $formatted_patients[$idx]['chronicConditions'] = array_values(array_map(function($r){
                    return $r['Condition_name'] ?? '';
                }, $mcs));
            }
        } catch (Exception $e) {
            // non-fatal - leave empty
        }

        try {
            $rx_sql = "SELECT p.prescription_id, p.medication_name as name, CONCAT(p.dosage, ' - ', p.frequency) as frequency, CONCAT(d.First_Name, ' ', d.Last_Name) as prescribed_by, p.start_date, p.end_date, p.notes
                       FROM Prescription p
                       LEFT JOIN Doctor d ON p.doctor_id = d.Doctor_id
                       WHERE p.patient_id = ?
                       AND (p.end_date IS NULL OR p.end_date >= CURDATE())
                       ORDER BY p.start_date DESC";
            $rxs = executeQuery($conn, $rx_sql, 'i', [$rawId]);
            if (is_array($rxs)) {
                $formatted_patients[$idx]['currentMedications'] = array_map(function($m){
                    return [
                        'id' => $m['prescription_id'] ?? null,
                        'name' => $m['name'] ?? '',
                        'frequency' => $m['frequency'] ?? '',
                        'prescribed_by' => $m['prescribed_by'] ?? '',
                        'start_date' => $m['start_date'] ?? null,
                        'end_date' => $m['end_date'] ?? null,
                        'instructions' => $m['notes'] ?? ''
                    ];
                }, $rxs);
            }
        } catch (Exception $e) {
            // non-fatal - leave empty
        }
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