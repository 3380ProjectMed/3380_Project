<?php
declare(strict_types=1);
// Allow cross-origin requests from the frontend dev server
require_once __DIR__ . '/../../cors.php';
// cors.php will set Content-Type and handle OPTIONS
// Minimal debug info for local development only
try {
  $info = [
    'sapi' => php_sapi_name(),
    'php_version' => phpversion(),
    'ini_error_log' => ini_get('error_log'),
    'display_errors' => ini_get('display_errors'),
    'html_errors' => ini_get('html_errors'),
    'extensions' => get_loaded_extensions(),
  ];

  $mysqli_capable = false;
  if (extension_loaded('mysqli')) {
    $info['mysqli_loaded'] = true;
    // Try to create a mysqli instance (use env or defaults)
    $mh = @new mysqli(
      getenv('DB_HOST') ?: 'localhost',
      getenv('DB_USER') ?: 'app',
      getenv('DB_PASSWORD') ?: '',
      getenv('DB_NAME') ?: 'med-app-db',
      (int)(getenv('DB_PORT') ?: 3306)
    );
    if ($mh && !$mh->connect_errno) {
      $info['mysqli_client_info'] = mysqli_get_client_info();
      $info['mysqli_server_info'] = $mh->server_info ?? null;
      $info['mysqli_get_result_method'] = method_exists($mh, 'get_result');
    } else {
      $info['mysqli_connect_error'] = $mh ? $mh->connect_error : 'unknown';
    }
  } else {
    $info['mysqli_loaded'] = false;
  }

  echo json_encode($info, JSON_PRETTY_PRINT);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'exception', 'message' => $e->getMessage()]);
}
