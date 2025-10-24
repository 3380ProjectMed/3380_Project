<?php
// This endpoint has been deprecated. Referrals from PCP are delivered directly to specialists.
http_response_code(410);
header('Content-Type: application/json');
echo json_encode(['success' => false, 'error' => 'approve.php is deprecated. Use specialist workflow (get-received.php).']);
exit;
?>