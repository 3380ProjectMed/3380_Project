<?php
header('Content-Type: application/json');
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';


try {
    //session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $email = $_SESSION['email'] ?? '';
    if (empty($email)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'No session email']);
        exit;
    }

    $conn = getDBConnection();

    // Resolve nurse_id from session email
    $nrows = executeQuery($conn, 'SELECT n.nurse_id, CONCAT(s.first_name, " ", s.last_name) AS nurse_name, s.staff_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1', 's', [$email]);
    if (empty($nrows)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Nurse not found']);
        exit;
    }

    $nurse_id = (int)$nrows[0]['nurse_id'];
    $nurse_name = $nrows[0]['nurse_name'] ?? null;

    $appointment_id = isset($_GET['appointment_id']) ? intval($_GET['appointment_id']) : 0;
    if ($appointment_id <= 0) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'appointment_id required']);
        exit;
    }

    // Look for existing patient_visit
    $vrows = executeQuery($conn, 'SELECT visit_id, appointment_id, nurse_id, status FROM patient_visit WHERE appointment_id = ? LIMIT 1', 'i', [$appointment_id]);
    if (!empty($vrows)) {
        $v = $vrows[0];
        closeDBConnection($conn);
        echo json_encode([
            'success' => true,
            'visitId' => (int)$v['visit_id'],
            'appointmentId' => (int)$v['appointment_id'],
            'nurseId' => isset($v['nurse_id']) ? (int)$v['nurse_id'] : null,
            'status' => $v['status'] ?? null
        ]);
        exit;
    }

    // If no visit, get appointment info to populate patient_id/date
    $arows = executeQuery($conn, 'SELECT Appointment_id, Patient_id, Appointment_date, Doctor_id, Office_id FROM appointment WHERE Appointment_id = ? LIMIT 1', 'i', [$appointment_id]);
    if (empty($arows)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Appointment not found']);
        exit;
    }
    $appt = $arows[0];
    $patient_id = isset($appt['Patient_id']) ? intval($appt['Patient_id']) : 0;
    $appt_date = $appt['Appointment_date'] ?? null;
    $doctor_id = isset($appt['Doctor_id']) ? intval($appt['Doctor_id']) : null;
    $office_id = isset($appt['Office_id']) ? intval($appt['Office_id']) : null;

    $sql = 'INSERT INTO patient_visit (appointment_id, patient_id, date, doctor_id, nurse_id, office_id, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    $param_types = 'iisiiiss';
    $created_by = $nurse_name ?: $email;
    executeQuery($conn, $sql, $param_types, [$appointment_id, $patient_id, $appt_date, $doctor_id, $nurse_id, $office_id, 'Scheduled', $created_by]);
    $visit_id = $conn->insert_id;

    $pv = executeQuery($conn, 'SELECT visit_id, appointment_id, blood_pressure, temperature, present_illnesses FROM patient_visit WHERE visit_id = ? LIMIT 1', 'i', [$visit_id]);
    $existingVitals = [];
    if (!empty($pv)) {
        $r = $pv[0];
        $existingVitals = [
            'blood_pressure' => $r['blood_pressure'] ?? null,
            'temperature' => $r['temperature'] ?? null,
            'present_illnesses' => $r['present_illnesses'] ?? null
        ];
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'visitId' => (int)$visit_id,
        'appointmentId' => (int)$appointment_id,
        'nurseId' => $nurse_id,
        'status' => 'Scheduled',
        'existingVitals' => $existingVitals
    ]);
} catch (Throwable $e) {
    if (isset($conn)) closeDBConnection($conn);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
