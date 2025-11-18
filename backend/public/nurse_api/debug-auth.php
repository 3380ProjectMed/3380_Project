<?php
// Debug endpoint to test authentication
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

// Check authentication
if (!isset($_SESSION['uid'])) {
    echo json_encode(['success' => false, 'error' => 'UNAUTHENTICATED - no session uid']);
    exit;
}

// Get staff details
require_once '../../lib/db.php';

$staffRows = $pdo->prepare("SELECT * FROM staff WHERE email = ? LIMIT 1");
$staffRows->execute([$_SESSION['uid']]);
$staff = $staffRows->fetch();

if (!$staff) {
    echo json_encode(['success' => false, 'error' => 'UNAUTHENTICATED - staff not found for email: ' . $_SESSION['uid']]);
    exit;
}

if ($staff['role'] !== 'nurse') {
    echo json_encode(['success' => false, 'error' => 'UNAUTHORIZED - role is: ' . $staff['role']]);
    exit;
}

echo json_encode([
    'success' => true, 
    'message' => 'Authentication successful',
    'session_uid' => $_SESSION['uid'],
    'staff_id' => $staff['staff_id'],
    'staff_name' => $staff['first_name'] . ' ' . $staff['last_name'],
    'role' => $staff['role']
]);
?>