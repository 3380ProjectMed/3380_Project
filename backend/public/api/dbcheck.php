<?php
// dbcheck.php
// Allow cross-origin requests from dev server
require_once __DIR__ . '/../../cors.php';
#getting env variables to establish database connection
$host = getenv('DB_HOST') ?: 'db';
$user = getenv('DB_USER') ?: 'app';
$pass = getenv('DB_PASSWORD') ?: '';
$name = getenv('DB_NAME') ?: 'med-app-db';
$port = (int)(getenv('DB_PORT') ?: 3306);

#attempt connection
$mysqli = @new mysqli($host, $user, $pass, $name, $port);

#checking for connection errors
if ($mysqli->connect_errno) {
  echo json_encode([
    'ok' => false,
    'status' => 'disconnected',
    'database' => $name,
    'host' => $host,
    'port' => $port,
    'error' => $mysqli->connect_error,
    'error_code' => $mysqli->connect_errno
  ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
} else {
  // Test basic connectivity
  $stmt = "SELECT * FROM information_schema.tables WHERE table_schema = '$name' LIMIT 1";
  $testQuery = $mysqli->query('SELECT 1 as connection_test');
  $version = $mysqli->get_server_info();
  
  // Get table count
  $tableQuery = $mysqli->query(
    "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = '$name'"
  );
  $tableRow = $tableQuery->fetch_assoc();
  $tableCount = $tableRow['table_count'];
  
  // List all tables
  $listQuery = $mysqli->query(
    "SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = '$name'"
  );
  $tables = [];
  while ($row = $listQuery->fetch_assoc()) {
    $tables[] = $row['TABLE_NAME'];
  }
  
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
  ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
}
?>