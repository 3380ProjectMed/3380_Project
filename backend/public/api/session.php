<?php
// session.php
declare(strict_types=1);

// Detect HTTPS (behind Azure's proxy or directly)
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
    || (!empty($_SERVER['HTTP_X_ARR_SSL']))  // Azure-specific
    || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);

// Only configure if no session active yet
if (session_status() !== PHP_SESSION_ACTIVE) {
    $cookieLifetime = 86400; // 1 day in seconds

    // Database connection for sessions
    $host = getenv('AZURE_MYSQL_HOST') ?: 'medconnect-db.mysql.database.azure.com';
    $user = getenv('AZURE_MYSQL_USERNAME') ?: 'aad_mysql_medapp';
    $pass = getenv('AZURE_MYSQL_PASSWORD') ?: 'QuinnRocks!';
    $db   = getenv('AZURE_MYSQL_DBNAME') ?: 'med-app-db';
    $port = (int)(getenv('AZURE_MYSQL_PORT') ?: '3306');

    // Custom session handler using database
    class DatabaseSessionHandler implements SessionHandlerInterface
    {
        private $conn;

        public function __construct($host, $user, $pass, $db, $port)
        {
            $this->conn = mysqli_init();
            $sslCertPath = '/home/site/wwwroot/certs/DigiCertGlobalRootG2.crt';

            if (file_exists($sslCertPath)) {
                $this->conn->ssl_set(NULL, NULL, $sslCertPath, NULL, NULL);
                $this->conn->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, 1);
            } else {
                $this->conn->ssl_set(NULL, NULL, NULL, NULL, NULL);
                $this->conn->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, 0);
            }

            if (!@$this->conn->real_connect($host, $user, $pass, $db, $port, NULL, MYSQLI_CLIENT_SSL)) {
                error_log("Session handler DB connection failed: " . $this->conn->connect_error);
                // Fall back to default file handler if DB connection fails
                return false;
            }

            $this->conn->set_charset('utf8mb4');
            $this->createTableIfNotExists();
        }

        private function createTableIfNotExists()
        {
            $sql = "CREATE TABLE IF NOT EXISTS sessions (
                session_id VARCHAR(128) NOT NULL PRIMARY KEY,
                session_data TEXT,
                last_access INT(10) UNSIGNED NOT NULL,
                INDEX idx_last_access (last_access)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

            $this->conn->query($sql);
        }

        public function open($save_path, $session_name): bool
        {
            return true;
        }

        public function close(): bool
        {
            if ($this->conn) {
                $this->conn->close();
            }
            return true;
        }

        public function read($session_id): string|false
        {
            $stmt = $this->conn->prepare("SELECT session_data FROM sessions WHERE session_id = ?");
            if (!$stmt) {
                return '';
            }

            $stmt->bind_param('s', $session_id);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($row = $result->fetch_assoc()) {
                $stmt->close();
                return $row['session_data'];
            }

            $stmt->close();
            return '';
        }

        public function write($session_id, $session_data): bool
        {
            $access = time();

            $stmt = $this->conn->prepare(
                "INSERT INTO sessions (session_id, session_data, last_access) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                    session_data = VALUES(session_data), 
                    last_access = VALUES(last_access)"
            );

            if (!$stmt) {
                return false;
            }

            $stmt->bind_param('ssi', $session_id, $session_data, $access);
            $result = $stmt->execute();
            $stmt->close();

            return $result;
        }

        public function destroy($session_id): bool
        {
            $stmt = $this->conn->prepare("DELETE FROM sessions WHERE session_id = ?");
            if (!$stmt) {
                return false;
            }

            $stmt->bind_param('s', $session_id);
            $result = $stmt->execute();
            $stmt->close();

            return $result;
        }

        public function gc($max_lifetime): int|false
        {
            $old = time() - $max_lifetime;
            $stmt = $this->conn->prepare("DELETE FROM sessions WHERE last_access < ?");

            if (!$stmt) {
                return 0;
            }

            $stmt->bind_param('i', $old);
            $stmt->execute();
            $affected = $stmt->affected_rows;
            $stmt->close();

            return $affected;
        }
    }

    // Set up database session handler
    $handler = new DatabaseSessionHandler($host, $user, $pass, $db, $port);
    session_set_save_handler($handler, true);

    // How long PHP keeps session data on server
    ini_set('session.gc_maxlifetime', (string)$cookieLifetime);
    // Security-ish defaults
    ini_set('session.use_only_cookies', '1');
    ini_set('session.use_strict_mode', '1');

    session_start([
        'cookie_lifetime' => $cookieLifetime,   // how long cookie stays in browser
        'cookie_httponly' => true,
        'cookie_secure'   => $isHttps,
        'cookie_samesite' => $isHttps ? 'None' : 'Lax',
    ]);
}
