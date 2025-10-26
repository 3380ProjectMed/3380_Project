<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Read environment variables
$host = $_ENV['AZURE_MYSQL_HOST'] ?? getenv('AZURE_MYSQL_HOST') ?: '';
$user = $_ENV['AZURE_MYSQL_USERNAME'] ?? getenv('AZURE_MYSQL_USERNAME') ?: '';
$pass = $_ENV['AZURE_MYSQL_PASSWORD'] ?? getenv('AZURE_MYSQL_PASSWORD') ?: '';
$name = $_ENV['AZURE_MYSQL_DBNAME'] ?? getenv('AZURE_MYSQL_DBNAME') ?: '';
$port = (int)($_ENV['AZURE_MYSQL_PORT'] ?? getenv('AZURE_MYSQL_PORT') ?: 3306);

// Check if we have credentials
if (empty($host) || empty($user) || empty($name)) {
    echo json_encode([
        'ok' => false,
        'status' => 'error',
        'message' => 'Database credentials not configured',
        'config' => [
            'host_set' => !empty($host),
            'user_set' => !empty($user),
            'db_set' => !empty($name),
            'port' => $port
        ]
    ], JSON_PRETTY_PRINT);
    exit;
}

// Attempt connection
$mysqli = @new mysqli($host, $user, $pass, $name, $port);

// Check for connection errors
if ($mysqli->connect_errno) {
    echo json_encode([
        'ok' => false,
        'status' => 'disconnected',
        'database' => $name,
        'host' => $host,
        'port' => $port,
        'error' => $mysqli->connect_error,
        'error_code' => $mysqli->connect_errno
    ], JSON_PRETTY_PRINT);
    exit;
}

// Connection successful - get info
$version = $mysqli->get_server_info();

// Test query
$testQuery = $mysqli->query('SELECT 1 as connection_test');
$testResult = $testQuery ? $testQuery->fetch_assoc() : null;

// Get table count
$tableQuery = $mysqli->query(
    "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ?"
);
if ($tableQuery) {
    $stmt = $mysqli->prepare("SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ?");
    $stmt->bind_param('s', $name);
    $stmt->execute();
    $result = $stmt->get_result();
    $tableRow = $result->fetch_assoc();
    $tableCount = $tableRow['table_count'];
    $stmt->close();
} else {
    $tableCount = 0;
}

// List tables
$tables = [];
$stmt = $mysqli->prepare("SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ?");
$stmt->bind_param('s', $name);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $tables[] = $row['TABLE_NAME'];
}
$stmt->close();

$mysqli->close();

echo json_encode([
    'ok' => true,
    'status' => 'connected',
    'database' => $name,
    'host' => $host,
    'port' => $port,
    'mysql_version' => $version,
    'connection_test' => 'successful',
    'table_count' => $tableCount,
    'tables' => $tables
], JSON_PRETTY_PRINT);
?>