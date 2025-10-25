<?php
/**
 * Get patient visit details including vitals and notes
 * This is the main endpoint for the clinical workspace
 */
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    // Can fetch by visit_id, appointment_id, or patient_id
    $visit_id = isset($_GET['visit_id']) ? intval($_GET['visit_id']) : 0;
    $appointment_id = isset($_GET['appointment_id']) ? intval($_GET['appointment_id']) : 0;
    $patient_id = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;

    if ($visit_id === 0 && $appointment_id === 0 && $patient_id === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'visit_id, appointment_id, or patient_id required']);
        exit;
    }

    $conn = getDBConnection();

    // If appointment_id provided, find the corresponding visit
    if ($appointment_id > 0) {
        $sql = "SELECT 
                    pv.Visit_id,
                    pv.Appointment_id,
                    pv.Patient_id,
                    pv.Office_id,
                    pv.Date,
                    pv.Blood_pressure,
                    pv.Temperature,
                    pv.Doctor_id,
                    pv.Nurse_id,
                    pv.Status,
                    pv.Diagnosis,
                    pv.Treatment,
                    pv.Reason_for_Visit,
                    pv.Department,
                    pv.Present_illnesses,
                    pv.Start_at,
                    pv.End_at,
                    pv.CreatedAt,
                    pv.CreatedBy,
                    pv.LastUpdated,
                    pv.UpdatedBy,
                    CONCAT(p.First_Name, ' ', p.Last_Name) as patient_name,
                    p.dob,
                    p.BloodType,
                    ca.Allergies_Text as allergies,
                    cg.Gender_Text as gender,
                    CONCAT(d.First_Name, ' ', d.Last_Name) as doctor_name,
                    CONCAT(s.First_Name, ' ', s.Last_Name) as nurse_name,
                    o.Name as office_name,
                    a.Appointment_date,
                    a.Reason_for_visit as appointment_reason
                FROM PatientVisit pv
                LEFT JOIN Patient p ON pv.Patient_id = p.Patient_ID
                LEFT JOIN CodesAllergies ca ON p.Allergies = ca.AllergiesCode
                LEFT JOIN CodesGender cg ON p.Gender = cg.GenderCode
                LEFT JOIN Doctor d ON pv.Doctor_id = d.Doctor_id
                LEFT JOIN Nurse n ON pv.Nurse_id = n.Nurse_id
                LEFT JOIN Staff s ON n.Staff_id = s.Staff_id
                LEFT JOIN Office o ON pv.Office_id = o.Office_ID
                LEFT JOIN Appointment a ON pv.Appointment_id = a.Appointment_id
                WHERE pv.Appointment_id = ?
                ORDER BY pv.Date DESC
                LIMIT 1";
        
        $rows = executeQuery($conn, $sql, 'i', [$appointment_id]);
    } elseif ($visit_id > 0) {
        $sql = "SELECT 
                    pv.Visit_id,
                    pv.Appointment_id,
                    pv.Patient_id,
                    pv.Office_id,
                    pv.Date,
                    pv.Blood_pressure,
                    pv.Temperature,
                    pv.Doctor_id,
                    pv.Nurse_id,
                    pv.Status,
                    pv.Diagnosis,
                    pv.Treatment,
                    pv.Reason_for_Visit,
                    pv.Department,
                    pv.Present_illnesses,
                    pv.Start_at,
                    pv.End_at,
                    pv.CreatedAt,
                    pv.CreatedBy,
                    pv.LastUpdated,
                    pv.UpdatedBy,
                    CONCAT(p.First_Name, ' ', p.Last_Name) as patient_name,
                    p.dob,
                    p.BloodType,
                    ca.Allergies_Text as allergies,
                    cg.Gender_Text as gender,
                    CONCAT(d.First_Name, ' ', d.Last_Name) as doctor_name,
                    CONCAT(s.First_Name, ' ', s.Last_Name) as nurse_name,
                    o.Name as office_name
                FROM PatientVisit pv
                LEFT JOIN Patient p ON pv.Patient_id = p.Patient_ID
                LEFT JOIN CodesAllergies ca ON p.Allergies = ca.AllergiesCode
                LEFT JOIN CodesGender cg ON p.Gender = cg.GenderCode
                LEFT JOIN Doctor d ON pv.Doctor_id = d.Doctor_id
                LEFT JOIN Nurse n ON pv.Nurse_id = n.Nurse_id
                LEFT JOIN Staff s ON n.Staff_id = s.Staff_id
                LEFT JOIN Office o ON pv.Office_id = o.Office_ID
                WHERE pv.Visit_id = ?";
        
        $rows = executeQuery($conn, $sql, 'i', [$visit_id]);
    } else {
        // Get most recent visit for patient
        $sql = "SELECT 
                    pv.Visit_id,
                    pv.Appointment_id,
                    pv.Patient_id,
                    pv.Office_id,
                    pv.Date,
                    pv.Blood_pressure,
                    pv.Temperature,
                    pv.Doctor_id,
                    pv.Nurse_id,
                    pv.Status,
                    pv.Diagnosis,
                    pv.Treatment,
                    pv.Reason_for_Visit,
                    pv.Department,
                    pv.Present_illnesses,
                    pv.Start_at,
                    pv.End_at,
                    pv.CreatedAt,
                    pv.CreatedBy,
                    pv.LastUpdated,
                    pv.UpdatedBy,
                    CONCAT(p.First_Name, ' ', p.Last_Name) as patient_name,
                    p.dob,
                    p.BloodType,
                    ca.Allergies_Text as allergies,
                    cg.Gender_Text as gender,
                    CONCAT(d.First_Name, ' ', d.Last_Name) as doctor_name,
                    CONCAT(s.First_Name, ' ', s.Last_Name) as nurse_name,
                    o.Name as office_name
                FROM PatientVisit pv
                LEFT JOIN Patient p ON pv.Patient_id = p.Patient_ID
                LEFT JOIN CodesAllergies ca ON p.Allergies = ca.AllergiesCode
                LEFT JOIN CodesGender cg ON p.Gender = cg.GenderCode
                LEFT JOIN Doctor d ON pv.Doctor_id = d.Doctor_id
                LEFT JOIN Nurse n ON pv.Nurse_id = n.Nurse_id
                LEFT JOIN Staff s ON n.Staff_id = s.Staff_id
                LEFT JOIN Office o ON pv.Office_id = o.Office_ID
                WHERE pv.Patient_id = ?
                ORDER BY pv.Date DESC
                LIMIT 1";
        
        $rows = executeQuery($conn, $sql, 'i', [$patient_id]);
    }

    if (empty($rows)) {
        // No visit found - might be just an appointment without check-in yet
        http_response_code(404);
        echo json_encode([
            'success' => false, 
            'error' => 'No patient visit found. Patient may not have checked in yet.',
            'has_visit' => false
        ]);
        exit;
    }

    $visit = $rows[0];

    // Calculate age from DOB
    if (!empty($visit['dob'])) {
        $dob = new DateTime($visit['dob']);
        $now = new DateTime();
        $age = $now->diff($dob)->y;
    } else {
        $age = null;
    }

    // Format the response
    $response = [
        'success' => true,
        'has_visit' => true,
        'visit' => [
            'visit_id' => $visit['Visit_id'],
            'appointment_id' => $visit['Appointment_id'],
            'patient_id' => $visit['Patient_id'],
            'date' => $visit['Date'],
            'status' => $visit['Status'],
            'reason' => $visit['Reason_for_Visit'] ?? $visit['appointment_reason'] ?? '',
            'department' => $visit['Department'],
            'diagnosis' => $visit['Diagnosis'],
            'treatment' => $visit['Treatment'],
            'present_illnesses' => $visit['Present_illnesses'],
            'start_time' => $visit['Start_at'],
            'end_time' => $visit['End_at'],
            'created_at' => $visit['CreatedAt'],
            'created_by' => $visit['CreatedBy'],
            'last_updated' => $visit['LastUpdated'],
            'updated_by' => $visit['UpdatedBy'],
            'doctor_name' => $visit['doctor_name'],
            'nurse_name' => $visit['nurse_name'],
            'office_name' => $visit['office_name']
        ],
        'vitals' => [
            'blood_pressure' => $visit['Blood_pressure'],
            'temperature' => $visit['Temperature'],
            'recorded_by' => $visit['nurse_name']
        ],
        'patient' => [
            'id' => $visit['Patient_id'],
            'name' => $visit['patient_name'],
            'dob' => $visit['dob'],
            'age' => $age,
            'gender' => $visit['gender'],
            'blood_type' => $visit['BloodType'],
            'allergies' => $visit['allergies'] ?? 'None'
        ]
    ];

    // Enrich patient with medical history, medication history, chronic conditions and current medications
    $patient_id = $visit['Patient_id'];
    $response['patient']['medicalHistory'] = [];
    $response['patient']['medicationHistory'] = [];
    $response['patient']['chronicConditions'] = [];
    $response['patient']['currentMedications'] = [];

    try {
        $mh_sql = "SELECT Condition_Name, Diagnosis_Date FROM MedicalHistory WHERE Patient_ID = ? ORDER BY Diagnosis_Date DESC";
        $mhs = executeQuery($conn, $mh_sql, 'i', [$patient_id]);
        if (is_array($mhs)) {
            $response['patient']['medicalHistory'] = array_map(function($r){
                return [
                    'condition' => $r['Condition_Name'] ?? '',
                    'diagnosis_date' => $r['Diagnosis_Date'] ?? null
                ];
            }, $mhs);
        }
    } catch (Exception $e) {
        // non-fatal
    }

    try {
        $medhist_sql = "SELECT Drug_name, DurationAndFrequencyOfDrugUse FROM MedicationHistory WHERE Patient_ID = ?";
        $meds_h = executeQuery($conn, $medhist_sql, 'i', [$patient_id]);
        if (is_array($meds_h)) {
            $response['patient']['medicationHistory'] = array_map(function($r){
                return [
                    'drug' => $r['Drug_name'] ?? '',
                    'notes' => $r['DurationAndFrequencyOfDrugUse'] ?? ''
                ];
            }, $meds_h);
        }
    } catch (Exception $e) {
        // non-fatal
    }

    try {
        $mc_sql = "SELECT Condition_name, Diagnosis_date FROM MedicalCondition WHERE Patient_id = ? ORDER BY Diagnosis_date DESC";
        $mcs = executeQuery($conn, $mc_sql, 'i', [$patient_id]);
        if (is_array($mcs)) {
            $response['patient']['chronicConditions'] = array_map(function($r){
                return $r['Condition_name'] ?? '';
            }, $mcs);
        }
    } catch (Exception $e) {
        // non-fatal
    }

    try {
        $rx_sql = "SELECT p.prescription_id, p.medication_name as name, CONCAT(p.dosage, ' - ', p.frequency) as frequency, CONCAT(d.First_Name, ' ', d.Last_Name) as prescribed_by, p.start_date, p.end_date, p.notes
                   FROM Prescription p
                   LEFT JOIN Doctor d ON p.doctor_id = d.Doctor_id
                   WHERE p.patient_id = ?
                   AND (p.end_date IS NULL OR p.end_date >= CURDATE())
                   ORDER BY p.start_date DESC";
        $rxs = executeQuery($conn, $rx_sql, 'i', [$patient_id]);
        if (is_array($rxs)) {
            $response['patient']['currentMedications'] = array_map(function($m){
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
        // non-fatal
    }

    closeDBConnection($conn);
    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>