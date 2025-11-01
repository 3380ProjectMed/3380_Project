<?php
// backend/lib/db.php
// Central PDO connection using Azure env vars (fallbacks for local dev)
header('Content-Type: application/json');

try {
    $host = getenv('AZURE_MYSQL_HOST') ?: '127.0.0.1';
    $user = getenv('AZURE_MYSQL_USERNAME') ?: 'root';
    $pass = getenv('AZURE_MYSQL_PASSWORD') ?: '';
    $db   = getenv('AZURE_MYSQL_DBNAME') ?: 'med-app-db';
    $port = getenv('AZURE_MYSQL_PORT') ?: '3306';

    $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    // Expose $pdo globally to including scripts
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database connection failed',
        'details' => $e->getMessage()
    ]);
    exit;
}

