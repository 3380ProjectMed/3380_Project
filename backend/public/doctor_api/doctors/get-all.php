<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    $conn = getDBConnection();

    $sql = "SELECT d.doctor_id, d.first_name, d.last_name, d.specialty, s.specialty_name
            FROM doctor d
            LEFT JOIN specialty s ON d.specialty = s.specialty_id
            ORDER BY d.last_name, d.first_name";

    $results = executeQuery($conn, $sql);
    closeDBConnection($conn);

    // Normalize to a simple array
    $doctors = array_map(function($r) {
        return [
            'id' => $r['doctor_id'],
            'first_name' => $r['first_name'],
            'last_name' => $r['last_name'],
            'name' => trim($r['first_name'] . ' ' . $r['last_name']),
            'specialty_id' => $r['specialty'],
            'specialty_name' => $r['specialty_name']
        ];
    }, $results);

    echo json_encode(['success' => true, 'doctors' => $doctors]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
