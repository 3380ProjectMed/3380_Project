<?php
// health.php
header('Content-Type: application/json');
echo json_encode([
  'ok' => true,
  'status' => 'healthy',
  'php_version' => phpversion(),
  'environment' => php_sapi_name(),
  'server_time' => date('c'),
  'uptime' => 'online'
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>