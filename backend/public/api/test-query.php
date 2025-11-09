<?php
/**
 * Test the exact query to debug the error
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    $conn = getDBConnection();
    
    // Test basic doctor query
    $sql1 = "SELECT doctor_id, first_name, last_name FROM doctor LIMIT 1";
    $result1 = $conn->query($sql1);
    
    if (!$result1) {
        throw new Exception("Query 1 failed: " . $conn->error);
    }
    
    $row1 = $result1->fetch_assoc();
    
    // Test with alias
    $sql2 = "SELECT d.doctor_id, d.first_name, d.last_name FROM doctor d LIMIT 1";
    $result2 = $conn->query($sql2);
    
    if (!$result2) {
        throw new Exception("Query 2 failed: " . $conn->error);
    }
    
    $row2 = $result2->fetch_assoc();
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'query1' => $row1,
        'query2' => $row2
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
