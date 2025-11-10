<?php
/**
 * Get all patients for a doctor
 */

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    error_reporting(E_ALL);
    error_log("=== Get All Patients API Called ===");

    $conn = getDBConnection();

    // Determine doctor_id: query param overrides, otherwise resolve from logged-in user
    $doctor_id = null;
    if (isset($_GET['doctor_id'])) {
        $doctor_id = intval($_GET['doctor_id']);
        error_log("Using doctor_id from query param: " . $doctor_id);
    } else {
        session_start();
        if (!isset($_SESSION['uid'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Not authenticated']);
            closeDBConnection($conn);
            exit;
        }

        $user_id = intval($_SESSION['uid']);
        // Note: doctor table is lowercase, but columns are lowercase too
        $rows = executeQuery($conn, '
            SELECT d.doctor_id 
            FROM user_account ua
            JOIN staff s ON ua.user_id = s.staff_id
            JOIN doctor d ON s.staff_id = d.staff_id
            WHERE ua.user_id = ? 
            LIMIT 1
            ', 'i', [$user_id]);        
        if (!is_array($rows) || count($rows) === 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No doctor associated with user']);
        closeDBConnection($conn);
        exit;
        }
        $doctor_id = (int) $rows[0]['doctor_id'];
    }

    error_log("Querying patients for doctor_id: " . $doctor_id);

    // SQL query - Azure database uses lowercase table names
    // appointment table has mixed case: Appointment_date, Patient_id, etc.
    // patient table has all lowercase columns
    $sql = "SELECT 
                p.patient_id,
                p.first_name,
                p.last_name,
                p.dob,
                p.email,
                p.emergency_contact_id,
                p.blood_type,
                ca.allergies_text as allergies,
                cg.gender_text as gender,
                MAX(a.Appointment_date) as last_visit,
                MIN(CASE WHEN a.Appointment_date > NOW() THEN a.Appointment_date END) as next_appointment
            FROM patient p
            LEFT JOIN codes_allergies ca ON p.allergies = ca.allergies_code
            LEFT JOIN codes_gender cg ON p.gender = cg.gender_code
            LEFT JOIN appointment a ON p.patient_id = a.Patient_id
            WHERE p.primary_doctor = ?
            GROUP BY p.patient_id, p.first_name, p.last_name, p.dob, p.email, 
                     p.emergency_contact_id, p.blood_type, ca.allergies_text, cg.gender_text
            ORDER BY p.last_name, p.first_name";

    $patients = executeQuery($conn, $sql, 'i', [$doctor_id]);

    error_log("Found " . count($patients) . " patients");

    // Format response
    $formatted_patients = [];
    foreach ($patients as $patient) {
        // Calculate age
        $age = 0;
        if ($patient['dob']) {
            try {
                $dob = new DateTime($patient['dob']);
                $now = new DateTime();
                $age = $now->diff($dob)->y;
            } catch (Exception $e) {
                error_log("Error calculating age: " . $e->getMessage());
            }
        }

        $formatted_patients[] = [
            'id' => 'P' . str_pad($patient['patient_id'], 3, '0', STR_PAD_LEFT),
            'name' => $patient['first_name'] . ' ' . $patient['last_name'],
            'dob' => $patient['dob'],
            'age' => $age,
            'gender' => $patient['gender'] ?: 'Not Specified',
            'email' => $patient['email'] ?: 'No email',
            // 'phone' => $patient['emergency_contact'] ?: 'No phone',
            'allergies' => $patient['allergies'] ?: 'No Known Allergies',
            'bloodType' => $patient['blood_type'] ?: 'Unknown',
            'lastVisit' => $patient['last_visit'] ? date('Y-m-d', strtotime($patient['last_visit'])) : 'No visits yet',
            'nextAppointment' => $patient['next_appointment'] ? date('Y-m-d', strtotime($patient['next_appointment'])) : 'None scheduled',
            'chronicConditions' => [],
            'currentMedications' => []
        ];
    }

    // Enrich each patient with chronic conditions and current medications
    foreach ($formatted_patients as $idx => $fp) {
        $rawId = isset($fp['id']) ? intval(preg_replace('/[^0-9]/', '', $fp['id'])) : 0;
        if ($rawId <= 0)
            continue;

        // Fetch medical conditions
        try {
            $mc_sql = "SELECT condition_name FROM medical_condition WHERE patient_id = ? ORDER BY diagnosis_date DESC";
            $mcs = executeQuery($conn, $mc_sql, 'i', [$rawId]);
            if (is_array($mcs)) {
                $formatted_patients[$idx]['chronicConditions'] = array_values(array_map(function ($r) {
                    return $r['condition_name'] ?? '';
                }, $mcs));
            }
        } catch (Exception $e) {
            error_log("Error fetching conditions for patient $rawId: " . $e->getMessage());
        }

        // Fetch current prescriptions
        try {
            $rx_sql = "SELECT 
                       p.prescription_id, 
                       p.medication_name as name, 
                       CONCAT(p.dosage, ' - ', p.frequency) as frequency, 
                       CONCAT(sf.first_name, ' ', sf.last_name) as prescribed_by, 
                       p.start_date, 
                       p.end_date, 
                       p.notes
                       FROM prescription p
                       LEFT JOIN doctor d ON p.doctor_id = d.doctor_id
                       LEFT JOIN staff sf ON d.staff_id = sf.staff_id
                       WHERE p.patient_id = ?
                       AND (p.end_date IS NULL OR p.end_date >= CURDATE())
                       ORDER BY p.start_date DESC";
            $rxs = executeQuery($conn, $rx_sql, 'i', [$rawId]);
            if (is_array($rxs)) {
                $formatted_patients[$idx]['currentMedications'] = array_map(function ($m) {
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
            error_log("Error fetching prescriptions for patient $rawId: " . $e->getMessage());
        }
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'patients' => $formatted_patients,
        'count' => count($formatted_patients)
    ]);

} catch (Exception $e) {
    error_log("Fatal error in get-all.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>