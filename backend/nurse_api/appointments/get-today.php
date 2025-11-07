<?php
require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../_bootstrap.php';

try {
    $today = date('Y-m-d');

        $sql = "SELECT a.status
                            FROM appointment a
                         WHERE DATE(a.appointment_date) = ?";

        $rows = executeQuery($pdo, $sql, 's', [$today]);

    $total = count($rows);
    $waiting = 0; $upcoming = 0; $completed = 0;
    foreach ($rows as $r) {
        $s = strtolower($r['status'] ?? '');
        if ($s === 'in waiting' || $s === 'waiting') $waiting++;
        if ($s === 'scheduled' || $s === 'upcoming') $upcoming++;
        if ($s === 'completed') $completed++;
    }

    echo json_encode([
        'total' => $total,
        'waiting' => $waiting,
        'upcoming' => $upcoming,
        'completed' => $completed
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load today appointments', 'message' => $e->getMessage()]);
}
