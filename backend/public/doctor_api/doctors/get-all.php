<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    $conn = getDBConnection();

    $sql = "SELECT d.Doctor_id, d.First_Name, d.Last_Name, d.Specialty, s.specialty_name
            FROM Doctor d
            LEFT JOIN Specialty s ON d.Specialty = s.specialty_id
            ORDER BY d.Last_Name, d.First_Name";

    $results = executeQuery($conn, $sql);
    closeDBConnection($conn);

    // Normalize to a simple array
    $doctors = array_map(function($r) {
        return [
            'id' => $r['Doctor_id'],
            'first_name' => $r['First_Name'],
            'last_name' => $r['Last_Name'],
            'name' => trim($r['First_Name'] . ' ' . $r['Last_Name']),
            'specialty_id' => $r['Specialty'],
            'specialty_name' => $r['specialty_name']
        ];
    }, $results);

    echo json_encode(['success' => true, 'doctors' => $doctors]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
