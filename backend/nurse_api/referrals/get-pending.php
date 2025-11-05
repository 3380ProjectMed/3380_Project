<?php
require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../_bootstrap.php';

try {
    // Only ADMIN can approve; nurses can list their requested referrals
    if ($role === 'ADMIN') {
        $rows = executeQuery($pdo, 'SELECT id, patient_id AS patientId, to_specialty AS to, reason, priority, requested_by AS requestedBy, requested_by_role AS requestedByRole, created_at FROM referrals WHERE status = "pending" ORDER BY created_at DESC');
    } else {
        $rows = executeQuery($pdo, 'SELECT id, patient_id AS patientId, to_specialty AS to, reason, priority, requested_by AS requestedBy, requested_by_role AS requestedByRole, created_at FROM referrals WHERE requested_by = ? ORDER BY created_at DESC', 'i', [$userId]);
    }
    echo json_encode($rows);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load referrals', 'message' => $e->getMessage()]);
}
