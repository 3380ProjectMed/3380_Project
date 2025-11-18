<?php
header('Content-Type: application/json');
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $conn = getDBConnection();
    $email = $_SESSION['email'] ?? '';

    // Verify nurse authentication
    $nurseRows = executeQuery(
        $conn,
        "SELECT n.nurse_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1",
        's',
        [$email]
    );

    if (empty($nurseRows)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Nurse not found']);
        closeDBConnection($conn);
        exit;
    }

    // Get all available allergy codes
    $allergySql = "SELECT 
                    allergies_code as code,
                    allergies_text as name
                FROM codes_allergies
                ORDER BY allergies_text";
    
    $allergyRows = executeQuery($conn, $allergySql);
    
    $allergyCodes = [];
    foreach ($allergyRows as $row) {
        $allergyCodes[] = [
            'id' => intval($row['code']),
            'name' => $row['name']
        ];
    }

    closeDBConnection($conn);
    echo json_encode([
        'success' => true,
        'allergyCodes' => $allergyCodes
    ]);

} catch (Exception $e) {
    if (isset($conn)) closeDBConnection($conn);
    error_log('[get-allergy-codes] Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to load allergy codes']);
}
?>