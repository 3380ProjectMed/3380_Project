<?php
// database.php - Database connection for med-app-db

// Read DB configuration from environment variables with safe fallbacks
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_USER', getenv('DB_USER') ?: 'user');
define('DB_PASS', getenv('DB_PASSWORD') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'med-app-db');

/**
 * Get database connection
 * @return mysqli Database connection object
 */
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    // Check connection
    if ($conn->connect_error) {
        // Throw exception so API caller can handle the error
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }

    // Set charset to utf8mb4
    $conn->set_charset("utf8mb4");

    return $conn;
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
        throw new Exception('Query execution failed: ' . $stmt->error);
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