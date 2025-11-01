<?php
require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../_bootstrap.php';

try {
    $apptId = isset($_GET['apptId']) ? intval($_GET['apptId']) : 0;
    if (!$apptId) { http_response_code(400); echo json_encode(['error'=>'Missing apptId']); exit; }

    $body = json_decode(file_get_contents('php://input'), true);
    if (!$body) { http_response_code(400); echo json_encode(['error'=>'Invalid body']); exit; }

    // Ensure nurse is assigned or admin
    if ($role !== 'ADMIN') {
        $chk = executeQuery($pdo, 'SELECT 1 FROM Appointment WHERE Appointment_id = ? AND assigned_nurse_id = ? LIMIT 1', 'ii', [$apptId, $userId]);
        if (empty($chk)) { http_response_code(403); echo json_encode(['error'=>'Forbidden']); exit; }
    }

    $bp = $body['bp'] ?? null;
    $hr = $body['hr'] ?? null;
    $temp = $body['temp'] ?? null;
    $spo2 = $body['spo2'] ?? null;
    $height = $body['height'] ?? null;
    $weight = $body['weight'] ?? null;

    // Upsert using INSERT ... ON DUPLICATE KEY UPDATE (assumes appointment_id is PK)
    $sql = "INSERT INTO vitals (appointment_id, bp, hr, temp, spo2, height, weight, recorded_by, recorded_by_role, recorded_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE bp = VALUES(bp), hr = VALUES(hr), temp = VALUES(temp), spo2 = VALUES(spo2), height = VALUES(height), weight = VALUES(weight), recorded_by = VALUES(recorded_by), recorded_by_role = VALUES(recorded_by_role), recorded_at = NOW()";

    $stmt = $pdo->prepare($sql);
    if (!$stmt) { throw new Exception('Prepare failed: ' . $pdo->error); }
    $recorded_by = $userId; $recorded_by_role = 'NURSE';
    // Types: i (apptId), s(bp), s(hr), s(temp), s(spo2), s(height), s(weight), i(recorded_by), s(recorded_by_role)
    $stmt->bind_param('issssssis', $apptId, $bp, $hr, $temp, $spo2, $height, $weight, $recorded_by, $recorded_by_role);
    if (!$stmt->execute()) {
        throw new Exception('Failed to save vitals: ' . $stmt->error);
    }
    $stmt->close();

    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save vitals', 'message' => $e->getMessage()]);
}
