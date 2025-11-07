<?php
require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../_bootstrap.php';

try {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id']);
        exit;
    }

    // normalize id: allow 'p1001' or numeric
    $idNum = preg_replace('/[^0-9]/', '', $id);

    $sql = "SELECT p.patient_id AS id, p.first_name AS firstName, p.last_name AS lastName,
                DATE_FORMAT(p.dob, '%Y-%m-%d') AS dob, p.allergies AS allergies, p.email AS email, p.phone AS phone,
                p.medical_history AS history, p.medications AS medications
            FROM patient p
           WHERE p.patient_id = ? LIMIT 1";

    $rows = executeQuery($pdo, $sql, 'i', [(int)$idNum]);
    if (empty($rows)) {
        http_response_code(404);
        echo json_encode(['error' => 'Patient not found']);
        exit;
    }
    $r = $rows[0];
    $out = [
        'id' => 'p' . $r['id'],
        'firstName' => $r['firstName'],
        'lastName' => $r['lastName'],
        'dob' => $r['dob'],
        'allergies' => $r['allergies'],
        'email' => $r['email'],
        'phone' => $r['phone'],
        'history' => $r['history'] ?? '',
        'medications' => $r['medications'] ?? ''
    ];

    echo json_encode($out);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load patient', 'message' => $e->getMessage()]);
}
