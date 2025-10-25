<?php
// health.php
// Allow cross-origin requests from dev server
require_once __DIR__ . '/../../cors.php';
// cors.php sets Content-Type for JSON responses
echo json_encode([
  'ok' => true,
  'status' => 'healthy',
  'php_version' => phpversion(),
  'environment' => php_sapi_name(),
  'server_time' => date('c'),
  'uptime' => 'online'
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>