<?php
// session.php
declare(strict_types=1);

// Detect HTTPS (behind Azure’s proxy or directly)
$isHttps =
    (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

// Only start if no session active yet
if (session_status() !== PHP_SESSION_ACTIVE) {
    $cookieLifetime = 86400; // 1 day in seconds

    // How long PHP keeps session data on server
    ini_set('session.gc_maxlifetime', (string)$cookieLifetime);
    // Security-ish defaults
    ini_set('session.use_only_cookies', '1');
    ini_set('session.use_strict_mode', '1');

    session_start([
        'cookie_lifetime' => $cookieLifetime,   // how long cookie stays in browser
        'cookie_httponly' => true,
        'cookie_secure'   => $isHttps,
        'cookie_samesite' => 'Lax',
    ]);
}
