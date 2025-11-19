<?php
/**
 * Get patient by id
 * Accepts `patient_id` (numeric) or `id` like 'P001'
 * FIXED: Uses lowercase table/column names throughout
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
    if ($numeric <= 0)
        throw new Exception('Invalid patient id');

    // Get patient basic info - all lowercase table and column names
    $sql = "SELECT 
                p.patient_id,
                p.first_name,
                p.last_name,
                p.dob,
                p.email,
                p.emergency_contact_id,
                p.blood_type,
                (
                    SELECT GROUP_CONCAT(ca2.allergies_text SEPARATOR ', ')
                    FROM allergies_per_patient app2
                    JOIN codes_allergies ca2 ON app2.allergy_id = ca2.allergies_code
                    WHERE app2.patient_id = p.patient_id
                ) as allergies,
                cg.gender_text as gender
            FROM patient p
            LEFT JOIN codes_gender cg ON p.gender = cg.gender_code
            WHERE p.patient_id = ?
            LIMIT 1";

    $rows = executeQuery($conn, $sql, 'i', [$numeric]);
    if (count($rows) === 0) {
        closeDBConnection($conn);
        echo json_encode(['success' => false, 'error' => 'Patient not found']);
        exit;
    }

    $p = $rows[0];
    $age = 0;
    if ($p['dob']) {
        try {
            $dob = new DateTime($p['dob']);
            $now = new DateTime();
            $age = $now->diff($dob)->y;
        } catch (Exception $e) {
            // Age calculation failed, keep as 0
        }
    }

    $patient = [
        'id' => 'P' . str_pad($p['patient_id'], 3, '0', STR_PAD_LEFT),
        'patient_id' => (int) $p['patient_id'],
        'name' => $p['first_name'] . ' ' . $p['last_name'],
        'dob' => $p['dob'],
        'age' => $age,
        'gender' => $p['gender'] ?: 'Not Specified',
        'email' => $p['email'] ?: 'No email',
        'phone' => '', // Will be populated from emergency_contact if needed
        'allergies' => $p['allergies'] ?: 'No Known Allergies',
        'bloodType' => $p['blood_type'] ?: 'Unknown',
        'medicalHistory' => [],
        'chronicConditions' => [],
        'currentMedications' => []
    ];

    // Fetch medical conditions (chronic conditions)
    try {
        $conditions_sql = "SELECT 
                            mc.condition_id,
                            mc.condition_name,
                            mc.diagnosis_date
                          FROM medical_condition mc
                          WHERE mc.patient_id = ?
                          ORDER BY mc.diagnosis_date DESC";

        $conditions = executeQuery($conn, $conditions_sql, 'i', [$numeric]);
        if (is_array($conditions) && count($conditions) > 0) {
            $patient['chronicConditions'] = array_map(function ($c) {
                return $c['condition_name'] ?? '';
            }, $conditions);

            $patient['medicalHistory'] = array_map(function ($c) {
                return [
                    'condition' => $c['condition_name'] ?? '',
                    'diagnosis_date' => $c['diagnosis_date'] ?? null
                ];
            }, $conditions);
        }
    } catch (Exception $e) {
        error_log("Error fetching medical conditions: " . $e->getMessage());
    }

    // Fetch current prescriptions
    try {
        $meds_sql = "SELECT 
                     p.prescription_id, 
                     p.medication_name as name, 
                     CONCAT(p.dosage, ' - ', p.frequency) as frequency, 
                     CONCAT(s.first_name, ' ', s.last_name) as prescribed_by, 
                     p.start_date, 
                     p.end_date, 
                     p.notes
                     FROM prescription p
                     LEFT JOIN staff s ON p.doctor_id = s.staff_id
                     WHERE p.patient_id = ?
                     AND (p.end_date IS NULL OR p.end_date >= CURDATE())
                     ORDER BY p.start_date DESC";

        $meds = executeQuery($conn, $meds_sql, 'i', [$numeric]);
        if (is_array($meds)) {
            $patient['currentMedications'] = array_map(function ($m) {
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
        error_log("Error fetching medications: " . $e->getMessage());
    }

    // Fetch recent visit summaries from patient_visit
    try {
        $visits_sql = "SELECT 
                       v.visit_id, 
                       v.appointment_id, 
                       v.date as visit_date, 
                       v.reason_for_visit, 
                       CONCAT(s.first_name, ' ', s.last_name) as doctor_name, 
                       v.diagnosis, 
                       v.blood_pressure, 
                       v.temperature
                       FROM patient_visit v
                       LEFT JOIN staff s ON v.doctor_id = s.staff_id
                       WHERE v.patient_id = ?
                       ORDER BY v.date DESC
                       LIMIT 50";

        $visits = executeQuery($conn, $visits_sql, 'i', [$numeric]);
        if (is_array($visits) && count($visits) > 0) {
            // If we have visits, append them to medical history
            $visitHistory = array_map(function ($v) {
                return [
                    'visit_id' => $v['visit_id'] ?? null,
                    'appointment_id' => $v['appointment_id'] ?? null,
                    'date' => $v['visit_date'] ?? null,
                    'reason' => $v['reason_for_visit'] ?? '',
                    'doctor_name' => $v['doctor_name'] ?? '',
                    'diagnosis' => $v['diagnosis'] ?? '',
                    'treatment' => $v['treatment'] ?? '',
                    'blood_pressure' => $v['blood_pressure'] ?? null,
                    'temperature' => $v['temperature'] ?? null
                ];
            }, $visits);

            // Merge visits with chronic conditions in medicalHistory
            $patient['medicalHistory'] = array_merge($patient['medicalHistory'], $visitHistory);
        }
    } catch (Exception $e) {
        error_log("Error fetching medical history: " . $e->getMessage());
    }

    closeDBConnection($conn);
    echo json_encode(['success' => true, 'patient' => $patient]);

} catch (Exception $e) {
    error_log("Error in get-by-id.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>