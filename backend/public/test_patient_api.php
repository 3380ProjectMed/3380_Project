<?php
// test_patient_api.php - Minimal test version to debug schema issues

require_once 'helpers.php';

header('Content-Type: application/json');

// Database connection
$host = getenv('AZURE_MYSQL_HOST') ?: 'localhost';
$user = getenv('AZURE_MYSQL_USERNAME') ?: 'root';
$pass = getenv('AZURE_MYSQL_PASSWORD') ?: '';
$name = getenv('AZURE_MYSQL_DBNAME') ?: 'med-app-db';
$port = (int)(getenv('AZURE_MYSQL_PORT') ?: 3306);

try {
    $mysqli = new mysqli($host, $user, $pass, $name, $port);
    
    if ($mysqli->connect_error) {
        sendResponse(false, [], 'Database connection failed: ' . $mysqli->connect_error, 500);
    }
    
    // Test 1: Simple table existence check
    $result = $mysqli->query("SHOW TABLES LIKE 'patient'");
    if ($result && $result->num_rows > 0) {
        $tables_found[] = 'patient table exists';
    } else {
        $tables_found[] = 'patient table NOT found';
    }
    
    // Test 2: Check column names in patient table
    $result = $mysqli->query("DESCRIBE patient");
    $columns = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $columns[] = $row['Field'];
        }
    }
    
    // Test 3: Simple select to test if basic query works
    $patient_count = 0;
    $result = $mysqli->query("SELECT COUNT(*) as count FROM patient");
    if ($result) {
        $row = $result->fetch_assoc();
        $patient_count = $row['count'];
    }
    
    sendResponse(true, [
        'connection' => 'success',
        'tables_found' => $tables_found,
        'patient_columns' => $columns,
        'patient_count' => $patient_count,
        'environment' => [
            'host' => $host,
            'user' => $user,
            'dbname' => $name,
            'port' => $port
        ]
    ]);
    
} catch (Exception $e) {
    sendResponse(false, [], 'Error: ' . $e->getMessage(), 500);
}

$mysqli->close();
?>