<?php
header('Content-Type: application/json');
$host = getenv('DB_HOST') ?: 'db';
$user = getenv('DB_USER') ?: 'app';
$pass = getenv('DB_PASSWORD') ?: '';
$name = getenv('DB_NAME') ?: 'med-app-db';
$port = (int)(getenv('DB_PORT') ?: 3306);

$mysqli = @new mysqli($host, $user, $pass, $name, $port);
echo json_encode($mysqli->connect_errno
  ? ['ok'=>false,'error'=>$mysqli->connect_error]
  : ['ok'=>true,'db'=>'connected']);
//curl.exe -i http://localhost:8080/dbcheck.php
