<?php
require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../_bootstrap.php';

try {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!$body) { http_response_code(400); echo json_encode(['error'=>'Invalid body']); exit; }

    $patientIdRaw = $body['patientId'] ?? null;
    $toSpecialty = $body['toSpecialty'] ?? ($body['toDepartment'] ?? null);
    $reason = $body['reason'] ?? null;
    $priority = $body['priority'] ?? 'Routine';

    if (!$patientIdRaw || !$toSpecialty) { http_response_code(400); echo json_encode(['error'=>'Missing required fields']); exit; }

    $patientId = preg_replace('/[^0-9]/', '', $patientIdRaw);

    $stmt = $pdo->prepare('INSERT INTO referrals (patient_id, to_specialty, reason, priority, requested_by, requested_by_role, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())');
    if (!$stmt) throw new Exception('Prepare failed: ' . $pdo->error);
    $roleStr = 'NURSE';
    $stmt->bind_param('isssis', $patientId, $toSpecialty, $reason, $priority, $userId, $roleStr);
    if (!$stmt->execute()) throw new Exception('Failed to create referral: ' . $stmt->error);
    $id = $stmt->insert_id;
    $stmt->close();

    echo json_encode(['id' => $id, 'createdAt' => date('c')]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create referral', 'message' => $e->getMessage()]);
}
