<?php
// database.php - Database connection for Azure MySQL

// Read DB configuration from Azure environment variables
define('DB_HOST', getenv('AZURE_MYSQL_HOST') ?: '127.0.0.1');
define('DB_USER', getenv('AZURE_MYSQL_USERNAME') ?: 'user');
define('DB_PASS', getenv('AZURE_MYSQL_PASSWORD') ?: '');
define('DB_NAME', getenv('AZURE_MYSQL_DBNAME') ?: 'med-app-db');
define('DB_PORT', (int)(getenv('AZURE_MYSQL_PORT') ?: '3306'));

/**
 * Get database connection with SSL for Azure MySQL
 * @return mysqli Database connection object
 */
function getDBConnection() {
    // Initialize mysqli with SSL for Azure MySQL
    $mysqli = mysqli_init();
    if (!$mysqli) {
        throw new Exception('mysqli_init failed');
    }

    // Set SSL options BEFORE connecting
    $sslCertPath = '/home/site/wwwroot/certs/DigiCertGlobalRootG2.crt';
    
    if (file_exists($sslCertPath)) {
        $mysqli->ssl_set(NULL, NULL, $sslCertPath, NULL, NULL);
        $mysqli->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, true);
        error_log("Using SSL certificate: $sslCertPath");
    } else {
        // Fallback: try to connect with SSL but without certificate verification
        $mysqli->ssl_set(NULL, NULL, NULL, NULL, NULL);
        $mysqli->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, false);
        error_log("SSL certificate not found at $sslCertPath, using SSL without verification");
    }

    // Connect with SSL
    if (!@$mysqli->real_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT, NULL, MYSQLI_CLIENT_SSL)) {
        throw new Exception('Database connection failed: ' . $mysqli->connect_error);
    }

    // Set charset to utf8mb4
    $mysqli->set_charset('utf8mb4');

    return $mysqli;
}

/**
 * Close database connection
 * @param mysqli $conn Database connection to close
 */
function closeDBConnection($conn) {
    if ($conn) {
        $conn->close();
    }
}

/**
 * Execute a prepared statement and return results
 */
function executeQuery($conn, $sql, $types = '', $params = []) {
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception('Failed to prepare statement: ' . $conn->error);
    }

    // Bind parameters if provided
    if (!empty($types) && !empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    // Execute query
    if (!$stmt->execute()) {
        // Capture both error message and error number for trigger handling
        $errorMsg = $stmt->error;
        $errorNo = $stmt->errno;
        $exception = new Exception('Query execution failed: ' . $errorMsg);
        // Store error number as a property for later access
        $exception->errorCode = $errorNo;
        throw $exception;
    }

    $result = $stmt->get_result();
    $data = [];

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
    }

    $stmt->close();
    return $data;
}
?>