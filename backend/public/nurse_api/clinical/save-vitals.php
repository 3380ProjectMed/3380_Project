<?php
header('Content-Type: application/json');
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

date_default_timezone_set('America/Chicago');

if (empty($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'UNAUTHENTICATED']);
    exit;
}

try {
    $conn = getDBConnection();
    $email = $_SESSION['email'] ?? '';

    error_log('[save-vitals] Starting save vitals for email: ' . $email);

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
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'NURSE_NOT_FOUND']);
        closeDBConnection($conn);
        exit;
    }

    $nurseId = (int)$rows[0]['nurse_id'];
    error_log('[save-vitals] Found nurse_id: ' . $nurseId);

    // 2) Get appointment_id from URL params or JSON body
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?? [];
    
    error_log('[save-vitals] Raw input: ' . $rawInput);
    error_log('[save-vitals] Parsed input: ' . json_encode($input));
    error_log('[save-vitals] GET params: ' . json_encode($_GET));
    
    $appointmentId = (int)($_GET['appointment_id'] ?? $_GET['apptId'] ?? $input['appointment_id'] ?? $input['appointmentId'] ?? 0);
    error_log('[save-vitals] Final appointment ID: ' . $appointmentId);
    
    if ($appointmentId <= 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'error' => 'APPOINTMENT_ID_REQUIRED',
            'debug' => [
                'get_appointment_id' => $_GET['appointment_id'] ?? 'missing',
                'get_apptId' => $_GET['apptId'] ?? 'missing',
                'input_appointment_id' => $input['appointment_id'] ?? 'missing',
                'input_appointmentId' => $input['appointmentId'] ?? 'missing',
                'raw_input' => $rawInput,
                'get_params' => $_GET
            ]
        ]);
        closeDBConnection($conn);
        exit;
    }

    // Parse payload for vitals data
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON body']);
        closeDBConnection($conn);
        exit;
    }

    $bp     = trim($input['bp']     ?? $input['blood_pressure'] ?? '');
    $hr     = trim($input['hr']     ?? $input['heart_rate'] ?? '');
    $temp   = trim($input['temp']   ?? $input['temperature'] ?? '');
    $spo2   = trim($input['spo2']   ?? '');
    $weight = trim($input['weight'] ?? '');
    $height = trim($input['height'] ?? '');
    $notes  = trim($input['present_illnesses'] ?? '');

    error_log('[save-vitals] Vitals - BP: ' . $bp . ', Temp: ' . $temp . ', HR: ' . $hr . ', SpO2: ' . $spo2 . ', Notes: ' . $notes);

    // 3) Get or create patient_visit
    $visitId = null;
    $patientId = null;

    // First, try to find existing visit for this appointment and nurse
    $visitRows = executeQuery(
        $conn,
        "SELECT visit_id, patient_id
           FROM patient_visit
          WHERE appointment_id = ? AND nurse_id = ?
          LIMIT 1",
        'ii',
        [$appointmentId, $nurseId]
    );

    if (!empty($visitRows)) {
        // Visit exists, use it
        $visitId = (int)$visitRows[0]['visit_id'];
        $patientId = (int)$visitRows[0]['patient_id'];
        error_log('[save-vitals] Found existing visit_id: ' . $visitId);
    } else {
        error_log('[save-vitals] No existing visit found, creating new one');
        // No visit exists, create one
        // First look up the appointment to get patient_id and other details
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

        // Get the new visit_id
        $visitId = $conn->insert_id;
        error_log('[save-vitals] Created new visit_id: ' . $visitId);
        if (!$visitId) {
            throw new Exception('Failed to create patient visit');
        }
    }

    // 4) Update vitals on patient_visit
    // Build update query for available columns
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

    // Ensure we always have at least one update
    if (empty($updates)) {
        throw new Exception('No updates to perform');
    }

    // Execute the update
    $sql = "UPDATE patient_visit SET " . implode(', ', $updates) . ", last_updated = NOW() WHERE visit_id = ?";
    $types .= 'i';
    $params[] = $visitId;

    error_log('[save-vitals] Executing SQL: ' . $sql);
    error_log('[save-vitals] SQL params: ' . json_encode($params));
    error_log('[save-vitals] SQL types: ' . $types);

    executeQuery($conn, $sql, $types, $params);

    error_log('[save-vitals] SQL executed successfully');

    // ========================================
    // 🆕 NEW: Update appointment status to "Ready"
    // ========================================
    // This signals to the doctor that vitals are recorded and patient is ready to be seen
    try {
        $updateStatusSql = "UPDATE appointment 
                           SET Status = 'Ready'
                           WHERE Appointment_id = ?
                           AND Status IN ('Checked-in', 'Scheduled')";
        
        executeQuery($conn, $updateStatusSql, 'i', [$appointmentId]);
        error_log('[save-vitals] Updated appointment status to Ready for appointment_id: ' . $appointmentId);
        $newStatus = 'Ready';
    } catch (Exception $statusError) {
        // Log but don't fail the whole operation if status update fails
        error_log('[save-vitals] Failed to update appointment status: ' . $statusError->getMessage());
        $newStatus = null;
    }
    // ========================================

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'visitId' => $visitId,
        'appointmentId' => $appointmentId,
        'patientId' => $patientId,
        'new_status' => $newStatus, // 🆕 NEW: Return the new status
        'vitals' => [
            'bp' => $bp,
            'hr' => $hr,
            'temp' => $temp,
            'spo2' => $spo2,
            'weight' => $weight,
            'height' => $height,
            'present_illnesses' => $notes
        ]
    ]);
} catch (Throwable $e) {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
    http_response_code(500);
    error_log('[nurse_api] save-vitals.php error: ' . $e->getMessage());
    error_log('[nurse_api] save-vitals.php stack trace: ' . $e->getTraceAsString());

    echo json_encode([
        'success' => false,
        'error' => 'FAILED_TO_SAVE_VITALS',
        'message' => $e->getMessage(),
        'debug' => [
            'appointmentId' => $appointmentId ?? 'unknown',
            'nurseId' => $nurseId ?? 'unknown',
            'visitId' => $visitId ?? 'unknown'
        ]
    ]);
}