<?php
header('Content-Type: application/json');
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {
    //session_start();
    if (empty($_SESSION['uid']) || empty($_SESSION['role'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $conn = getDBConnection();
    $email = $_SESSION['email'] ?? '';

    $sql = "SELECT ua.username, ua.email, ua.role, s.first_name, s.last_name, s.license_number, s.gender, cg.gender_text AS gender_description,
                    n.nurse_id, n.staff_id, n.department,
                    ws.office_id, o.name AS office_name, o.address, o.city, o.state, o.zipcode
            FROM user_account ua
            LEFT JOIN staff s ON s.staff_email = ua.email
            LEFT JOIN codes_gender cg ON s.gender = cg.gender_code
            LEFT JOIN nurse n ON n.staff_id = s.staff_id
            LEFT JOIN work_schedule ws ON s.staff_id = ws.staff_id
            LEFT JOIN office o ON o.office_id = ws.office_id
            WHERE ua.email = ?
            LIMIT 1";

    $rows = executeQuery($conn, $sql, 's', [$email]);
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Profile not found']);
        exit;
    }

    $r = $rows[0];

    $location = null;
    if (!empty($r['office_id'])) {
        $location = [
            'officeId' => (int) $r['office_id'],
            'name' => $r['office_name'] ?? null,
            'address' => $r['address'] ?? null,
            'city' => $r['city'] ?? null,
            'state' => $r['state'] ?? null,
            'zipcode' => $r['zipcode'] ?? null,
        ];
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'profile' => [
            'nurseId' => isset($r['nurse_id']) ? (int) $r['nurse_id'] : null,
            'staffId' => isset($r['staff_id']) ? (int) $r['staff_id'] : null,
            'firstName' => $r['first_name'] ?? $r['username'] ?? '',
            'lastName' => $r['last_name'] ?? '',
            'email' => $r['email'] ?? '',
            'department' => $r['department'] ?? '',
            'licenseNumber' => $r['license_number'] ?? '',
            'gender' => $r['gender_description'] ?? $r['gender'] ?? '',
            'workLocation' => $location
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
