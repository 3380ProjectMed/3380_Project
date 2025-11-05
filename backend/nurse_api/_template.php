<?php
require_once __DIR__ . '/../../lib/db.php';

try {
    // Example: read current user id from query string or mocked value
    $userId = $_GET['user_id'] ?? null;

    // Example query (adjust table/columns to real schema)
    $stmt = $pdo->prepare("
        SELECT id, note, created_at
        FROM clinical_notes
        WHERE nurse_id = :uid
        ORDER BY created_at DESC
        LIMIT 50
    ");
    $stmt->execute([':uid' => $userId]);
    $rows = $stmt->fetchAll();

    echo json_encode(['ok' => true, 'data' => $rows]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
