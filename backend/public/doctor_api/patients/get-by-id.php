<?php
/**
 * Get patient by id
 * Accepts `patient_id` (numeric) or `id` like 'P001'
 */

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

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

    // Fetch current prescriptions for this patient (if Prescription table exists)
    try {
    $meds_sql = "SELECT p.prescription_id, p.medication_name as name, CONCAT(p.dosage, ' - ', p.frequency) as frequency, CONCAT(d.First_Name, ' ', d.Last_Name) as prescribed_by, p.start_date, p.end_date, p.notes
                     FROM Prescription p
                     LEFT JOIN Doctor d ON p.doctor_id = d.Doctor_id
                     WHERE p.patient_id = ?
                     AND (p.end_date IS NULL OR p.end_date >= CURDATE())
                     ORDER BY p.start_date DESC";

        $meds = executeQuery($conn, $meds_sql, 'i', [$numeric]);
        if (is_array($meds)) {
            $patient['currentMedications'] = array_map(function($m) {
                return [
                    'id' => $m['prescription_id'] ?? null,
                    'name' => $m['name'] ?? '',
                    'frequency' => $m['frequency'] ?? '',
                    'prescribed_by' => $m['prescribed_by'] ?? '',
                    'start_date' => $m['start_date'] ?? null,
                    'end_date' => $m['end_date'] ?? null,
                    'instructions' => $m['notes'] ?? ''
                ];
            }, $meds);
        }
    } catch (Exception $e) {
        // non-fatal: leave currentMedications empty
    }

    // Fetch recent visit summaries from PatientVisit
    try {
        $visits_sql = "SELECT v.PatientVisit_id as visit_id, v.Appointment_id, v.Date as visit_date, v.Reason_for_Visit, CONCAT(d.First_Name, ' ', d.Last_Name) as doctor_name, v.Diagnosis, v.Treatment, v.Blood_pressure, v.Temperature
                       FROM PatientVisit v
                       LEFT JOIN Doctor d ON v.Doctor_id = d.Doctor_id
                       WHERE v.Patient_id = ?
                       ORDER BY v.Date DESC
                       LIMIT 50";

        $visits = executeQuery($conn, $visits_sql, 'i', [$numeric]);
        if (is_array($visits)) {
            $patient['medicalHistory'] = array_map(function($v) {
                return [
                    'visit_id' => $v['visit_id'] ?? null,
                    'appointment_id' => $v['Appointment_id'] ?? null,
                    'date' => $v['visit_date'] ?? null,
                    'reason' => $v['Reason_for_Visit'] ?? '',
                    'doctor_name' => $v['doctor_name'] ?? '',
                    'diagnosis' => $v['Diagnosis'] ?? '',
                    'treatment' => $v['Treatment'] ?? '',
                    'blood_pressure' => $v['Blood_pressure'] ?? null,
                    'temperature' => $v['Temperature'] ?? null
                ];
            }, $visits);
        }
    } catch (Exception $e) {
        // non-fatal: leave medicalHistory empty
    }

    closeDBConnection($conn);
    echo json_encode(['success' => true, 'patient' => $patient]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
