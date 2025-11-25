<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    $conn = getDBConnection();
    $sql = "SELECT st.staff_id, st.first_name, st.last_name, 
                   s.specialty_name, s.specialty_id
            FROM staff st
            JOIN doctor d ON d.staff_id = st.staff_id
            JOIN specialty s ON d.specialty = s.specialty_id
            ORDER BY st.last_name, st.first_name";

    $rows = executeQuery($conn, $sql);
    closeDBConnection($conn);

    echo json_encode(['success' => true, 'doctors' => $rows, 'count' => count($rows)]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}