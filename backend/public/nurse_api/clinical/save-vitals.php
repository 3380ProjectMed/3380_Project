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
    $conn  = getDBConnection();
    $email = $_SESSION['email'] ?? '';

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

    $nurse_id = (int)$rows[0]['nurse_id'];

    // 2) Validate appointment_id
    if (empty($_GET['appointment_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing appointment_id']);
        closeDBConnection($conn);
        exit;
    }

    $appointment_id = (int)$_GET['appointment_id'];

    // 3) Make sure a patient_visit exists for this appointment
    // 3) Find patient_visit for this appointment
    $visitRows = executeQuery(
        $conn,
        "SELECT visit_id, nurse_id
           FROM patient_visit
          WHERE appointment_id = ?
          LIMIT 1",
        'i',
        [$appointment_id]
    );

    if (empty($visitRows)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'VISIT_NOT_FOUND_FOR_APPOINTMENT']);
        closeDBConnection($conn);
        exit;
    }

    $visit_id = (int)$visitRows[0]['visit_id'];
    $visit_nurse_id = isset($visitRows[0]['nurse_id']) ? (int)$visitRows[0]['nurse_id'] : null;

    // 4) Parse JSON body for vitals
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON body']);
        closeDBConnection($conn);
        exit;
    }


    // Map known keys to columns that exist in schema
    $bp   = isset($body['bp']) ? $body['bp'] : null; // patient_visit.blood_pressure
    $temp = isset($body['temp']) ? $body['temp'] : null; // patient_visit.temperature

    // Determine which column updates to perform
    $updates = [];
    $params = [];
    $types = '';

    if (!is_null($bp)) {
        $updates[] = 'blood_pressure = ?';
        $types .= 's';
        $params[] = $bp;
    }
    if (!is_null($temp)) {
        $updates[] = 'temperature = ?';
        $types .= 's';
        $params[] = $temp;
    }

    // Always update audit columns
    $updates[] = 'updated_by = ?';
    $types .= 's';
    $params[] = $nurse_name ?: $email;

    // Build WHERE clause to ensure nurse owns the visit (or allow if null)
    // Use appointment_id and nurse_id to be safe
    $sql = "UPDATE patient_visit SET " . implode(', ', $updates) . " , last_updated = NOW() WHERE appointment_id = ?";
    $types .= 'i';
    $params[] = $appointment_id;

    // If patient_visit has a nurse_id, require it matches current nurse; otherwise allow update
    if (!is_null($visit_nurse_id)) {
        $sql .= ' AND nurse_id = ?';
        $types .= 'i';
        $params[] = $nurse_id;
    }

    if (empty($updates)) {
        // Nothing to update
        closeDBConnection($conn);
        echo json_encode(['success' => true, 'message' => 'No vitals to update', 'visitId' => $visit_id, 'appointmentId' => $appointment_id]);
        exit;
    }

    executeQuery($conn, $sql, $types, $params);

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'message' => 'Vitals saved to patient_visit',
        'visitId' => $visit_id,
        'appointmentId' => $appointment_id
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[nurse_api] save-vitals.php error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'INTERNAL_ERROR', 'message' => $e->getMessage()]);
}
