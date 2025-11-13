<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
header('Content-Type: application/json');

session_start();
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

    // 2) Validate appointment_id
    $appointmentId = (int)($_GET['appointment_id'] ?? $_GET['apptId'] ?? 0);
    error_log('[save-vitals] Appointment ID: ' . $appointmentId);
    if ($appointmentId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'APPOINTMENT_ID_REQUIRED']);
        closeDBConnection($conn);
        exit;
    }

    // 3) Parse JSON body for vitals
    $payload = json_decode(file_get_contents('php://input'), true);
    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON body']);
        closeDBConnection($conn);
        exit;
    }

    // Extract vitals from payload
    $bp    = trim($payload['bp']    ?? '');
    $hr    = trim($payload['hr']    ?? '');
    $temp  = trim($payload['temp']  ?? '');
    $spo2  = trim($payload['spo2']  ?? '');
    $weight= trim($payload['weight']?? '');
    $height= trim($payload['height']?? '');
    
    error_log('[save-vitals] Vitals - BP: ' . $bp . ', Temp: ' . $temp);

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

        // Insert new patient_visit row (using pattern from create-or-get.php)
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
        $types .= 's';
        $params[] = $temp;
    }

    // Check if we have any substantial updates (beyond just audit columns)
    $hasSubstantialUpdates = !empty($bp) || !empty($temp);
    
    if (!$hasSubstantialUpdates) {
        // Nothing substantial to update, but still return success
        closeDBConnection($conn);
        echo json_encode([
            'success' => true,
            'visitId' => $visitId,
            'appointmentId' => $appointmentId,
            'patientId' => $patientId,
            'vitals' => [
                'bp' => $bp,
                'hr' => $hr,  // Note: HR not stored in DB (no column exists)
                'temp' => $temp,
                'spo2' => $spo2,  // Note: SpO2 not stored in DB (no column exists)
                'weight' => $weight,  // Note: Weight not stored in DB (no column exists)
                'height' => $height   // Note: Height not stored in DB (no column exists)
            ]
        ]);
        exit;
    }

    // Add audit columns to the updates
    $updates[] = 'updated_by = ?';
    $types .= 's';
    $params[] = $email;

    // Execute the update
    $sql = "UPDATE patient_visit SET " . implode(', ', $updates) . ", last_updated = NOW() WHERE visit_id = ?";
    $types .= 'i';
    $params[] = $visitId;
    
    error_log('[save-vitals] Executing SQL: ' . $sql . ' with params: ' . json_encode($params));
    executeQuery($conn, $sql, $types, $params);

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
    error_log('[nurse_api] save-vitals.php error: ' . $e->getMessage() . "\nStack trace: " . $e->getTraceAsString());
    echo json_encode(['success' => false, 'error' => 'FAILED_TO_SAVE_VITALS']);
}
