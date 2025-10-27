<?php
require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../_bootstrap.php';

try {
    $apptId = isset($_GET['apptId']) ? intval($_GET['apptId']) : 0;
    if (!$apptId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing apptId']);
        exit;
    }

    // fetch appointment and patient
    $sql = "SELECT a.Appointment_id AS id, a.Appointment_date AS time, a.status, a.Reason_for_visit AS reason,
                   p.Patient_ID AS patientId, CONCAT(p.First_Name,' ',p.Last_Name) AS patientName,
                   DATE_FORMAT(p.DOB, '%Y-%m-%d') AS dob, p.Allergies AS allergies
              FROM Appointment a
              JOIN Patient p ON p.Patient_ID = a.Patient_id
             WHERE a.Appointment_id = ? LIMIT 1";

    $rows = executeQuery($pdo, $sql, 'i', [$apptId]);
    if (empty($rows)) {
        http_response_code(404);
        echo json_encode(['error' => 'Appointment not found']);
        exit;
    }
    $apt = $rows[0];

    // access control: allow if assigned nurse or ADMIN
    if ($role !== 'ADMIN') {
        $chk = executeQuery($pdo, 'SELECT 1 FROM Appointment WHERE Appointment_id = ? AND assigned_nurse_id = ? LIMIT 1', 'ii', [$apptId, $userId]);
        if (empty($chk)) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
    }

    // vitals
    $vrows = executeQuery($pdo, 'SELECT bp, hr, temp, spo2, height, weight FROM vitals WHERE appointment_id = ? LIMIT 1', 'i', [$apptId]);
    $vitals = !empty($vrows) ? $vrows[0] : null;

    // intake
    $irows = executeQuery($pdo, 'SELECT chief_complaint AS chiefComplaint, history, medications, allergies, notes FROM intake WHERE appointment_id = ? LIMIT 1', 'i', [$apptId]);
    $intake = !empty($irows) ? $irows[0] : null;

    // notes
    $nrows = executeQuery($pdo, 'SELECT id, author_id AS author, author_role AS authorRole, body, created_at AS createdAt FROM notes WHERE appointment_id = ? ORDER BY created_at DESC', 'i', [$apptId]);

    $out = [
        'appointment' => [
            'id' => (int)$apt['id'],
            'time' => $apt['time'],
            'status' => $apt['status'],
            'reason' => $apt['reason'],
            'patientId' => 'p' . $apt['patientId'],
            'patientName' => $apt['patientName']
        ],
        'patient' => [
            'id' => 'p' . $apt['patientId'],
            'dob' => $apt['dob'],
            'allergies' => $apt['allergies']
        ],
        'vitals' => $vitals,
        'intake' => $intake,
        'notes' => $nrows
    ];

    echo json_encode($out);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load summary', 'message' => $e->getMessage()]);
}
