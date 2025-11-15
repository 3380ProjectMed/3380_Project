<?php
header('Content-Type: application/json');
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
//session_start();
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
    
    $appointmentId = (int)($_GET['appointment_id'] ?? $_GET['apptId'] ?? $input['appointmentId'] ?? 0);
    error_log('[save-vitals] Final appointment ID: ' . $appointmentId);
    
    if ($appointmentId <= 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'error' => 'APPOINTMENT_ID_REQUIRED',
            'debug' => [
                'get_appointment_id' => $_GET['appointment_id'] ?? 'missing',
                'get_apptId' => $_GET['apptId'] ?? 'missing',
                'input_appointmentId' => $input['appointmentId'] ?? 'missing',
                'raw_input' => $rawInput,
                'get_params' => $_GET
            ]
        ]);
        closeDBConnection($conn);
        exit;
    }

    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?? [];
    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON body']);
        closeDBConnection($conn);
        exit;
    }

    $bp     = trim($payload['bp']     ?? '');
    $hr     = trim($payload['hr']     ?? '');
    $temp   = trim($payload['temp']   ?? '');
    $spo2   = trim($payload['spo2']   ?? '');
    $weight = trim($payload['weight'] ?? '');
    $height = trim($payload['height'] ?? '');

    error_log('[save-vitals] Vitals - BP: ' . $bp . ', Temp: ' . $temp . ', HR: ' . $hr . ', SpO2: ' . $spo2);

    // Validate that we have at least some vitals to save
    if (empty($bp) && empty($temp)) {
        error_log('[save-vitals] No vitals provided (BP and Temp both empty)');
        // Still proceed - we'll update audit columns at minimum
    }

    // 4) Get or create patient_visit
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

        // Insert new patient_visit row (using exact schema column names)
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

    // 5) Update vitals on patient_visit
    // Build update query for available columns (only blood_pressure and temperature exist in schema)
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
        $types .= 'd'; // decimal type for temperature
        $params[] = (float)$temp; // convert to numeric
    }

    // Always add audit columns 
    $updates[] = 'updated_by = ?';
    $types .= 's';
    $params[] = $email;

    // Ensure we always have at least one update (the audit column)
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

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'visitId' => $visitId,
        'appointmentId' => $appointmentId,
        'patientId' => $patientId,
        'vitals' => [
            'bp' => $bp,
            'hr' => $hr,
            'temp' => $temp,
            'spo2' => $spo2,
            'weight' => $weight,
            'height' => $height
        ]
    ]);
} catch (Throwable $e) {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
    http_response_code(500);
    error_log('[nurse_api] save-vitals.php error: ' . $e->getMessage());
    error_log('[nurse_api] save-vitals.php stack trace: ' . $e->getTraceAsString());

    // Include error details for debugging (remove in production)
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
