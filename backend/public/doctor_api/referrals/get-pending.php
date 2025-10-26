<?php
// This endpoint is deprecated. Use get-received.php to fetch referrals assigned to specialists.
http_response_code(410);
header('Content-Type: application/json');
echo json_encode(['success' => false, 'error' => 'get-pending.php is deprecated. Use get-received.php.']);
exit;
?>