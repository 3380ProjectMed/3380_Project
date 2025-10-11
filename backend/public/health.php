<?php
header('Content-Type: application/json');
echo json_encode([
  'ok' => true,
  'php' => phpversion(),
  'sapi' => php_sapi_name(),
  'time' => date('c')
]);
//curl.exe -i http://localhost:8080/health.php