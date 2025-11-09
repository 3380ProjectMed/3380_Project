<?php
/**
 * Test script to check actual doctor table column names
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

try {
    $conn = getDBConnection();
    
    // Get column information from doctor table
    $result = $conn->query("DESCRIBE doctor");
    
    $columns = [];
    while ($row = $result->fetch_assoc()) {
        $columns[] = $row['Field'];
    }
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'columns' => $columns
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
