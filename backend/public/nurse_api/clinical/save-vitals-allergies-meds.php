<?php
header('Content-Type: application/json');
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

if (empty($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'UNAUTHENTICATED']);
    exit;
}

try {
    $conn = getDBConnection();
    $email = $_SESSION['email'] ?? '';

    error_log('[save-vitals-allergies-meds] Starting save for email: ' . $email);

    // Start transaction
    $conn->autocommit(false);

    // 1) Resolve nurse_id from staff email
    $rows = executeQuery(
        $conn,
        "SELECT n.nurse_id
           FROM nurse n
           JOIN staff s ON n.staff_id = s.staff_id
          WHERE s.staff_email = ?
          LIMIT 1",
        's',
        [$email]
    );

    if (empty($rows)) {
        $conn->rollback();
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'NURSE_NOT_FOUND']);
        closeDBConnection($conn);
        exit;
    }
    $nurseId = (int)$rows[0]['nurse_id'];
    error_log('[save-vitals-allergies-meds] Found nurse_id: ' . $nurseId);

    // 2) Get input data
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?? [];
    
    error_log('[save-vitals-allergies-meds] Raw input: ' . $rawInput);

    $appointmentId = (int)($_GET['appointment_id'] ?? $_GET['apptId'] ?? $input['appointment_id'] ?? $input['appointmentId'] ?? 0);
    $patientId = (int)($input['patientId'] ?? 0);
    $visitId = (int)($input['visitId'] ?? 0);
    
    // Extract vitals data
    $vitals = $input['vitals'] ?? [];
    $bp = trim($vitals['bp'] ?? '');
    $hr = trim($vitals['hr'] ?? '');
    $temp = trim($vitals['temp'] ?? '');
    $spo2 = trim($vitals['spo2'] ?? '');
    $weight = trim($vitals['weight'] ?? '');
    $height = trim($vitals['height'] ?? '');
    $notes = trim($vitals['notes'] ?? $vitals['present_illnesses'] ?? '');

    // Extract allergies and medications
    $allergies = $input['allergies'] ?? [];
    $medications = $input['medications'] ?? [];

    error_log('[save-vitals-allergies-meds] Appointment ID: ' . $appointmentId);
    error_log('[save-vitals-allergies-meds] Patient ID: ' . $patientId);
    error_log('[save-vitals-allergies-meds] Allergies: ' . json_encode($allergies));
    error_log('[save-vitals-allergies-meds] Medications: ' . json_encode($medications));

    if ($appointmentId === 0) {
        $conn->rollback();
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'APPOINTMENT_ID_REQUIRED']);
        closeDBConnection($conn);
        exit;
    }

    // 3) Get or create patient visit (reuse existing logic)
    $visitRows = executeQuery(
        $conn,
        "SELECT visit_id, patient_id FROM patient_visit WHERE appointment_id = ? AND nurse_id = ? LIMIT 1",
        'ii',
        [$appointmentId, $nurseId]
    );

    if (!empty($visitRows)) {
        $visitId = (int)$visitRows[0]['visit_id'];
        $patientId = (int)$visitRows[0]['patient_id'];
        error_log('[save-vitals-allergies-meds] Found existing visit_id: ' . $visitId);
    } else {
        error_log('[save-vitals-allergies-meds] No existing visit found, creating new one');
        // Get appointment details to create visit
        $apptRows = executeQuery(
            $conn,
            "SELECT Appointment_id, Patient_id, Appointment_date, Doctor_id, Office_id
               FROM appointment
              WHERE Appointment_id = ?
              LIMIT 1",
            'i',
            [$appointmentId]
        );

        if (empty($apptRows)) {
            $conn->rollback();
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'APPOINTMENT_NOT_FOUND']);
            closeDBConnection($conn);
            exit;
        }

        $patientId = (int)$apptRows[0]['Patient_id'];
        $apptDate = $apptRows[0]['Appointment_date'] ?? null;
        $doctorId = isset($apptRows[0]['Doctor_id']) ? (int)$apptRows[0]['Doctor_id'] : null;
        $officeId = isset($apptRows[0]['Office_id']) ? (int)$apptRows[0]['Office_id'] : null;

        // Insert new patient_visit row
        executeQuery(
            $conn,
            "INSERT INTO patient_visit (appointment_id, patient_id, date, doctor_id, nurse_id, office_id, status, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            'iisiiiss',
            [$appointmentId, $patientId, $apptDate, $doctorId, $nurseId, $officeId, 'Scheduled', $email]
        );

        $visitId = $conn->insert_id;
        error_log('[save-vitals-allergies-meds] Created new visit_id: ' . $visitId);
        if (!$visitId) {
            $conn->rollback();
            throw new Exception('Failed to create patient visit');
        }
    }

    // 4) Update vitals on patient_visit
    $updates = [];
    $params = [];
    $types = '';

    if (!empty($bp)) {
        $updates[] = 'blood_pressure = ?';
        $types .= 's';
        $params[] = $bp;
    }
    if (!empty($temp)) {
        $updates[] = 'temperature = ?';
        $types .= 'd';
        $params[] = (float)$temp;
    }
    if (!empty($notes)) {
        $updates[] = 'present_illnesses = ?';
        $types .= 's';
        $params[] = $notes;
    }

    // Always add audit columns 
    $updates[] = 'updated_by = ?';
    $types .= 's';
    $params[] = $email;

    if (!empty($updates)) {
        $sql = "UPDATE patient_visit SET " . implode(', ', $updates) . ", last_updated = NOW() WHERE visit_id = ?";
        $types .= 'i';
        $params[] = $visitId;
        
        executeQuery($conn, $sql, $types, $params);
        error_log('[save-vitals-allergies-meds] Updated vitals successfully');
    }

    // 5) Update patient allergies
    if (!empty($allergies)) {
        // Remove existing allergies for this patient
        executeQuery(
            $conn,
            "DELETE FROM allergies_per_patient WHERE patient_id = ?",
            'i',
            [$patientId]
        );
        error_log('[save-vitals-allergies-meds] Deleted existing allergies');

        // Insert new allergies
        foreach ($allergies as $allergy) {
            if (isset($allergy['allergyId']) && $allergy['allergyId'] > 0) {
                $notes = isset($allergy['notes']) ? trim($allergy['notes']) : '';
                
                executeQuery(
                    $conn,
                    "INSERT INTO allergies_per_patient (patient_id, allergies_code, notes) VALUES (?, ?, ?)",
                    'iis',
                    [$patientId, (int)$allergy['allergyId'], $notes]
                );
            }
        }
        error_log('[save-vitals-allergies-meds] Inserted ' . count($allergies) . ' allergies');
    }

    // 6) Update patient medications
    if (!empty($medications)) {
        // Remove existing medications for this patient
        executeQuery(
            $conn,
            "DELETE FROM medication_history WHERE patient_id = ?",
            'i',
            [$patientId]
        );
        error_log('[save-vitals-allergies-meds] Deleted existing medications');

        // Insert new medications
        foreach ($medications as $medication) {
            if (isset($medication['name']) && !empty(trim($medication['name']))) {
                $drugName = trim($medication['name']);
                $dosageFrequency = isset($medication['dosageAndFrequency']) ? trim($medication['dosageAndFrequency']) : '';
                
                executeQuery(
                    $conn,
                    "INSERT INTO medication_history (patient_id, drug_name, duration_and_frequency_of_drug_use) VALUES (?, ?, ?)",
                    'iss',
                    [$patientId, $drugName, $dosageFrequency]
                );
            }
        }
        error_log('[save-vitals-allergies-meds] Inserted ' . count($medications) . ' medications');
    }

    // 7) Update appointment status to "Ready"
    try {
        $updateStatusSql = "UPDATE appointment 
                           SET Status = 'Ready'
                           WHERE Appointment_id = ?
                           AND Status IN ('Checked-in', 'Scheduled')";
        
        executeQuery($conn, $updateStatusSql, 'i', [$appointmentId]);
        error_log('[save-vitals-allergies-meds] Updated appointment status to Ready');
        $newStatus = 'Ready';
    } catch (Exception $statusError) {
        error_log('[save-vitals-allergies-meds] Failed to update appointment status: ' . $statusError->getMessage());
        $newStatus = null;
    }

    // Commit transaction
    $conn->commit();
    $conn->autocommit(true);
    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'visitId' => $visitId,
        'appointmentId' => $appointmentId,
        'patientId' => $patientId,
        'new_status' => $newStatus,
        'vitals' => [
            'bp' => $bp,
            'hr' => $hr,
            'temp' => $temp,
            'spo2' => $spo2,
            'weight' => $weight,
            'height' => $height,
            'present_illnesses' => $notes
        ],
        'allergies_saved' => count($allergies),
        'medications_saved' => count($medications)
    ]);

} catch (Throwable $e) {
    if (isset($conn)) {
        $conn->rollback();
        $conn->autocommit(true);
        closeDBConnection($conn);
    }
    
    http_response_code(500);
    error_log('[save-vitals-allergies-meds] Error: ' . $e->getMessage());
    error_log('[save-vitals-allergies-meds] Stack trace: ' . $e->getTraceAsString());

    echo json_encode([
        'success' => false,
        'error' => 'FAILED_TO_SAVE_VITALS_ALLERGIES_MEDS',
        'message' => $e->getMessage()
    ]);
}
?>