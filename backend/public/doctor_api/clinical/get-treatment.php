<?php

/**
 * Get treatment catalog - all available treatments
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
header('Content-Type: application/json');

try {
    //session_start();

    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $conn = getDBConnection();

    $sql = "SELECT 
                treatment_id,
                name as treatment_name,
                cost
            FROM treatment_catalog
            ORDER BY treatment_name";

    $rows = executeQuery($conn, $sql);

    $treatments = [];
    if (is_array($rows)) {
        $treatments = array_map(function ($r) {
            return [
                'treatment_id' => $r['treatment_id'] ?? null,
                'treatment_name' => $r['treatment_name'] ?? '',
                'cost' => $r['cost'] ?? 0
            ];
        }, $rows);
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'treatments' => $treatments
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
