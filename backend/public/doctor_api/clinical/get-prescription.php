<?php

/**
 * Get prescriptions for a patient and/or appointment
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
header('Content-Type: application/json');

try {
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $user_id = (int) $_SESSION['uid'];

    // Verify user is a doctor
    $conn = getDBConnection();
    $rows = executeQuery($conn, '
        SELECT s.staff_id 
        FROM staff s
        JOIN user_account ua ON ua.email = s.staff_email
        WHERE ua.user_id = ?', 'i', [$user_id]);

    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied - doctors only']);
        exit;
    }

    $patient_id = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;
    $appointment_id = isset($_GET['appointment_id']) ? intval($_GET['appointment_id']) : 0;

    if ($patient_id === 0 && $appointment_id === 0) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'patient_id or appointment_id required']);
        exit;
    }

    $params = [];
    $types = '';
    $where = [];

    if ($patient_id > 0) {
        $where[] = 'p.patient_id = ?';
        $types .= 'i';
        $params[] = $patient_id;
    }
    if ($appointment_id > 0) {
        $where[] = '(p.appointment_id = ? OR p.appointment_id IS NULL)';
        $types .= 'i';
        $params[] = $appointment_id;
    }

    $sql = 'SELECT p.prescription_id, p.patient_id, p.appointment_id, p.medication_name, p.dosage, p.frequency, p.route, p.start_date, p.end_date, p.refills_allowed, p.notes, p.doctor_id, p.created_at, CONCAT(s.first_name, " ", s.last_name) AS prescribed_by
            FROM prescription p
            LEFT JOIN staff s ON s.staff_id = p.doctor_id
            WHERE ' . implode(' OR ', $where) . ' ORDER BY p.start_date DESC, p.created_at DESC';

    $rows = executeQuery($conn, $sql, $types, $params);

    $prescriptions = [];
    foreach ($rows as $r) {
        $prescriptions[] = [
            'id' => (int) $r['prescription_id'],
            'patient_id' => (int) $r['patient_id'],
            'appointment_id' => isset($r['appointment_id']) ? (int) $r['appointment_id'] : null,
            'name' => $r['medication_name'],
            'dosage' => $r['dosage'],
            'frequency' => $r['frequency'],
            'route' => $r['route'],
            'start_date' => $r['start_date'],
            'end_date' => $r['end_date'],
            'refills_allowed' => (int) $r['refills_allowed'],
            'instructions' => $r['notes'],
            'prescribed_by' => $r['prescribed_by'] ?? null,
            'doctor_id' => isset($r['doctor_id']) ? (int) $r['doctor_id'] : null,
            'created_at' => $r['created_at'] ?? null
        ];
    }

    closeDBConnection($conn);

    echo json_encode(['success' => true, 'prescriptions' => $prescriptions]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

