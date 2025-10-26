<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

function respond($payload, $code = 200) {
  http_response_code($code);
  echo json_encode($payload, JSON_PRETTY_PRINT);
  exit;
}

try {
  // 1) Read config (env vars are the right way on App Service)
  $host = getenv('AZURE_MYSQL_HOST') ?: '';
  $user = getenv('AZURE_MYSQL_USERNAME') ?: '';
  $pass = getenv('AZURE_MYSQL_PASSWORD') ?: '';
  $db   = getenv('AZURE_MYSQL_DBNAME') ?: '';
  $port = getenv('AZURE_MYSQL_PORT') ?: '3306';

  if (!$host || !$user || !$db) {
    respond([
      'ok' => false,
      'stage' => 'config',
      'message' => 'Database credentials not configured',
      'config' => [
        'host_set' => (bool)$host,
        'user_set' => (bool)$user,
        'db_set'   => (bool)$db,
        'port'     => (int)$port
      ]
    ], 500);
  }

  // 2) Make mysqli throw exceptions instead of fatals
  mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

  // 3) Connect (TLS is required by Azure MySQL)
  $conn = mysqli_init();
  // Optional strict verification if you shipped the CA file:
  // $ca = __DIR__ . '/certs/DigiCertGlobalRootCA.crt.pem';
  // if (is_file($ca)) { mysqli_ssl_set($conn, null, null, $ca, null, null); }

  $conn->real_connect($host, $user, $pass, $db, (int)$port, null, MYSQLI_CLIENT_SSL);

  // 4) Basic test
  $res = $conn->query('SELECT 1 AS ok, @@version AS version, CURRENT_USER() AS user');
  $row = $res->fetch_assoc();

  // 5) Count tables (prepared to avoid fatals)
  $stmt = $conn->prepare('SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema = ?');
  $stmt->bind_param('s', $db);
  $stmt->execute();
  $tcRes = $stmt->get_result();
  $tableCount = (int)($tcRes->fetch_assoc()['table_count'] ?? 0);
  $stmt->close();

  // 6) List up to 50 tables (safe)
  $tables = [];
  $stmt = $conn->prepare('SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ? LIMIT 50');
  $stmt->bind_param('s', $db);
  $stmt->execute();
  $listRes = $stmt->get_result();
  while ($r = $listRes->fetch_assoc()) { $tables[] = $r['TABLE_NAME']; }
  $stmt->close();

  $conn->close();

  respond([
    'ok' => true,
    'status' => 'connected',
    'php' => PHP_VERSION,
    'mysql' => $row,
    'table_count' => $tableCount,
    'tables' => $tables
  ]);

} catch (Throwable $e) {
  // Never fatal; always JSON
  respond([
    'ok' => false,
    'stage' => 'exception',
    'message' => $e->getMessage(),
    'code' => $e->getCode()
  ], 500);
}
