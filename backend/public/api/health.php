<?php
declare(strict_types=1);
require_once __DIR__ . '/../cors.php'; // one level up from /api

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
  'ok'          => true,
  'status'      => 'healthy',
  'php_version' => PHP_VERSION,
  'environment' => php_sapi_name(),
  'server_time' => date('c'),
], JSON_UNESCAPED_SLASHES);
