<?php
/**
 * Chronic Disease Management Dashboard API
 * Location: /doctor_api/reports/get-chronic-disease-report.php
 * 
 * AUTHENTICATION: Uses exact same pattern as get-patient-details.php
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $user_id = intval($_SESSION['uid']);
    
    // Get user role and doctor info
    $conn = getDBConnection();
    
    $userQuery = "SELECT ua.role, d.doctor_id, CONCAT(s.first_name, ' ', s.last_name) as doctor_name
              FROM user_account ua 
              LEFT JOIN staff s ON ua.user_id = s.staff_id
              LEFT JOIN doctor d ON s.staff_id = d.staff_id
              WHERE ua.user_id = ? 
              LIMIT 1";
    $userInfo = executeQuery($conn, $userQuery, 'i', [$user_id]);
    
    if (!is_array($userInfo) || count($userInfo) === 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        closeDBConnection($conn);
        exit;
    }
    
    $userRole = $userInfo[0]['role'];
    $loggedInDoctorId = $userInfo[0]['doctor_id'];
    $doctorName = $userInfo[0]['doctor_name'];
    
    if ($userRole !== 'DOCTOR' && $userRole !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied. Only doctors and admins can access reports.']);
        closeDBConnection($conn);
        exit;
    }
    
    // Get filters
    $conditionFilter = isset($_GET['condition']) ? $_GET['condition'] : 'all';
    $riskFilter = isset($_GET['risk']) ? $_GET['risk'] : 'all';
    
    // Build WHERE clause for doctor filter
    $doctorWhere = "";
    $doctorParams = [];
    $doctorTypes = '';
    
    if ($userRole === 'DOCTOR' && $loggedInDoctorId) {
        $doctorWhere = "AND pv.doctor_id = ?";
        $doctorParams[] = $loggedInDoctorId;
        $doctorTypes = 'i';
    }
    
    // ============================================================================
    // MAIN QUERY: Get all chronic disease patients
    // ============================================================================
    $sql = "SELECT 
        p.patient_id,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.dob,
        TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) as age,
        cg.gender_text as gender,
        p.phone,
        
        mc.condition_name,
        mc.diagnosis_date,
        DATEDIFF(CURDATE(), mc.diagnosis_date) as days_since_diagnosis,
        
        latest_visit.visit_id as last_visit_id,
        latest_visit.visit_date as last_visit_date,
        latest_visit.blood_pressure as last_bp,
        latest_visit.temperature as last_temp,
        latest_visit.diagnosis as last_diagnosis,
        latest_visit.treatment as last_treatment,
        latest_visit.doctor_name as last_seen_by,
        
        DATEDIFF(CURDATE(), latest_visit.visit_date) as days_since_last_visit,
        
        CASE 
            WHEN latest_visit.visit_date IS NULL THEN 'CRITICAL'
            WHEN DATEDIFF(CURDATE(), latest_visit.visit_date) > 90 THEN 'CRITICAL'
            WHEN DATEDIFF(CURDATE(), latest_visit.visit_date) > 60 THEN 'DUE_SOON'
            ELSE 'ON_TRACK'
        END as followup_risk,
        
        COALESCE(med_count.active_meds, 0) as active_medications,
        COALESCE(med_expiring.expiring_soon, 0) as meds_expiring_soon,
        COALESCE(noshow_count.no_shows, 0) as no_show_count,
        COALESCE(completed_count.completed_visits, 0) as total_completed_visits,
        
        CASE 
            WHEN latest_visit.blood_pressure IS NOT NULL THEN
                CASE 
                    WHEN CAST(SUBSTRING_INDEX(latest_visit.blood_pressure, '/', 1) AS UNSIGNED) >= 140 
                         OR CAST(SUBSTRING_INDEX(latest_visit.blood_pressure, '/', -1) AS UNSIGNED) >= 90 
                    THEN 'UNCONTROLLED'
                    ELSE 'CONTROLLED'
                END
            ELSE 'NO_DATA'
        END as bp_control_status,
        
        next_appt.next_appointment_date,
        next_appt.next_appointment_reason
        
    FROM medical_condition mc
    JOIN patient p ON mc.patient_id = p.patient_id
    LEFT JOIN codes_gender cg ON p.gender = cg.gender_code
    
    LEFT JOIN (
        SELECT 
            pv.patient_id,
            pv.visit_id,
            pv.date as visit_date,
            pv.blood_pressure,
            pv.temperature,
            pv.diagnosis,
            pv.treatment,
            CONCAT(d.first_name, ' ', d.last_name) as doctor_name
        FROM patient_visit pv
        LEFT JOIN doctor d ON pv.doctor_id = d.doctor_id
        WHERE pv.status = 'Completed'
        AND (pv.date, pv.visit_id) IN (
            SELECT date, MAX(visit_id)
            FROM patient_visit
            WHERE status = 'Completed'
            GROUP BY patient_id, date
        )
        ORDER BY pv.date DESC
    ) latest_visit ON p.patient_id = latest_visit.patient_id
    
    LEFT JOIN (
        SELECT patient_id, COUNT(*) as active_meds
        FROM prescription
        WHERE end_date IS NULL OR end_date >= CURDATE()
        GROUP BY patient_id
    ) med_count ON p.patient_id = med_count.patient_id
    
    LEFT JOIN (
        SELECT patient_id, COUNT(*) as expiring_soon
        FROM prescription
        WHERE end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        GROUP BY patient_id
    ) med_expiring ON p.patient_id = med_expiring.patient_id
    
    LEFT JOIN (
        SELECT patient_id, COUNT(*) as no_shows
        FROM patient_visit
        WHERE status = 'No-Show'
        GROUP BY patient_id
    ) noshow_count ON p.patient_id = noshow_count.patient_id
    
    LEFT JOIN (
        SELECT patient_id, COUNT(*) as completed_visits
        FROM patient_visit
        WHERE status = 'Completed'
        GROUP BY patient_id
    ) completed_count ON p.patient_id = completed_count.patient_id
    
    LEFT JOIN (
        SELECT 
            a.Patient_id as patient_id,
            MIN(a.Appointment_date) as next_appointment_date,
            a.Reason_for_visit as next_appointment_reason
        FROM appointment a
        LEFT JOIN patient_visit pv ON a.Appointment_id = pv.appointment_id
        WHERE a.Appointment_date >= CURDATE()
        AND (pv.status IS NULL OR pv.status = 'Scheduled')
        GROUP BY a.Patient_id
    ) next_appt ON p.patient_id = next_appt.patient_id
    
    WHERE 1=1
    $doctorWhere
    ORDER BY 
        FIELD(followup_risk, 'CRITICAL', 'DUE_SOON', 'ON_TRACK'),
        days_since_last_visit DESC";
    
    $patients = executeQuery($conn, $sql, $doctorTypes, $doctorParams);
    
    if (!is_array($patients)) {
        $patients = [];
    }
    
    // Apply filters
    if ($conditionFilter !== 'all') {
        $patients = array_filter($patients, function($p) use ($conditionFilter) {
            return stripos($p['condition_name'], $conditionFilter) !== false;
        });
    }
    
    if ($riskFilter !== 'all') {
        $patients = array_filter($patients, function($p) use ($riskFilter) {
            return strtolower($p['followup_risk']) === strtolower($riskFilter);
        });
    }
    
    $patients = array_values($patients);
    
    // Calculate statistics
    $stats = [
        'total_patients' => count($patients),
        'critical_count' => 0,
        'due_soon_count' => 0,
        'on_track_count' => 0,
        'uncontrolled_bp_count' => 0,
        'no_bp_data_count' => 0,
        'meds_expiring_count' => 0,
        'high_risk_no_shows' => 0,
        'needs_medication_review' => 0,
        'no_scheduled_followup' => 0
    ];
    
    foreach ($patients as $patient) {
        if ($patient['followup_risk'] === 'CRITICAL') $stats['critical_count']++;
        if ($patient['followup_risk'] === 'DUE_SOON') $stats['due_soon_count']++;
        if ($patient['followup_risk'] === 'ON_TRACK') $stats['on_track_count']++;
        
        if ($patient['bp_control_status'] === 'UNCONTROLLED') $stats['uncontrolled_bp_count']++;
        if ($patient['bp_control_status'] === 'NO_DATA') $stats['no_bp_data_count']++;
        
        if ($patient['meds_expiring_soon'] > 0) {
            $stats['meds_expiring_count']++;
            $stats['needs_medication_review']++;
        }
        
        if ($patient['no_show_count'] >= 2) $stats['high_risk_no_shows']++;
        
        if (empty($patient['next_appointment_date']) && $patient['followup_risk'] !== 'ON_TRACK') {
            $stats['no_scheduled_followup']++;
        }
    }
    
    // Get condition breakdown
    $conditionBreakdown = [];
    foreach ($patients as $patient) {
        $condition = $patient['condition_name'];
        if (!isset($conditionBreakdown[$condition])) {
            $conditionBreakdown[$condition] = [
                'condition_name' => $condition,
                'total_patients' => 0,
                'critical' => 0,
                'due_soon' => 0,
                'on_track' => 0,
                'uncontrolled_bp' => 0
            ];
        }
        
        $conditionBreakdown[$condition]['total_patients']++;
        
        if ($patient['followup_risk'] === 'CRITICAL') $conditionBreakdown[$condition]['critical']++;
        if ($patient['followup_risk'] === 'DUE_SOON') $conditionBreakdown[$condition]['due_soon']++;
        if ($patient['followup_risk'] === 'ON_TRACK') $conditionBreakdown[$condition]['on_track']++;
        if ($patient['bp_control_status'] === 'UNCONTROLLED') $conditionBreakdown[$condition]['uncontrolled_bp']++;
    }
    
    usort($conditionBreakdown, function($a, $b) {
        return $b['total_patients'] - $a['total_patients'];
    });
    
    // Get medications for drill-down
    if (!empty($patients)) {
        $patientIds = array_column($patients, 'patient_id');
        $placeholders = implode(',', array_fill(0, count($patientIds), '?'));
        
        $medSql = "SELECT 
            pr.patient_id,
            pr.prescription_id,
            pr.medication_name,
            pr.dosage,
            pr.frequency,
            pr.start_date,
            pr.end_date,
            DATEDIFF(pr.end_date, CURDATE()) as days_until_expiration,
            CASE 
                WHEN pr.end_date < CURDATE() THEN 'EXPIRED'
                WHEN DATEDIFF(pr.end_date, CURDATE()) <= 7 THEN 'CRITICAL'
                WHEN DATEDIFF(pr.end_date, CURDATE()) <= 30 THEN 'EXPIRING_SOON'
                ELSE 'ACTIVE'
            END as prescription_status,
            CONCAT(d.first_name, ' ', d.last_name) as prescribed_by
        FROM prescription pr
        LEFT JOIN doctor d ON pr.doctor_id = d.doctor_id
        WHERE pr.patient_id IN ($placeholders)
        AND (pr.end_date IS NULL OR pr.end_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
        ORDER BY pr.patient_id, days_until_expiration ASC";
        
        $medTypes = str_repeat('i', count($patientIds));
        $medications = executeQuery($conn, $medSql, $medTypes, $patientIds);
        
        $medicationsByPatient = [];
        if (is_array($medications)) {
            foreach ($medications as $med) {
                $pid = $med['patient_id'];
                if (!isset($medicationsByPatient[$pid])) {
                    $medicationsByPatient[$pid] = [];
                }
                $medicationsByPatient[$pid][] = $med;
            }
        }
        
        foreach ($patients as &$patient) {
            $patient['medications'] = $medicationsByPatient[$patient['patient_id']] ?? [];
        }
        unset($patient);
        
        // Get visit history
        $visitSql = "SELECT 
            pv.patient_id,
            pv.visit_id,
            pv.date as visit_date,
            pv.blood_pressure,
            pv.temperature,
            pv.diagnosis,
            pv.status,
            CONCAT(d.first_name, ' ', d.last_name) as doctor_name
        FROM patient_visit pv
        LEFT JOIN doctor d ON pv.doctor_id = d.doctor_id
        WHERE pv.patient_id IN ($placeholders)
        AND pv.status = 'Completed'
        ORDER BY pv.patient_id, pv.date DESC";
        
        $visitTypes = str_repeat('i', count($patientIds));
        $visits = executeQuery($conn, $visitSql, $visitTypes, $patientIds);
        
        $visitsByPatient = [];
        if (is_array($visits)) {
            foreach ($visits as $visit) {
                $pid = $visit['patient_id'];
                if (!isset($visitsByPatient[$pid])) {
                    $visitsByPatient[$pid] = [];
                }
                if (count($visitsByPatient[$pid]) < 5) {
                    $visitsByPatient[$pid][] = $visit;
                }
            }
        }
        
        foreach ($patients as &$patient) {
            $patient['recent_visits'] = $visitsByPatient[$patient['patient_id']] ?? [];
        }
        unset($patient);
    }
    
    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'data' => [
            'patients' => $patients,
            'statistics' => $stats,
            'condition_breakdown' => $conditionBreakdown,
            'doctor_name' => $doctorName,
            'filters' => [
                'condition' => $conditionFilter,
                'risk' => $riskFilter
            ]
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage()
    ]);
}
?>