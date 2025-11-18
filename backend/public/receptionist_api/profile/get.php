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

    // Fetch receptionist profile from staff and work_schedule
    $sql = "SELECT ua.username, ua.email, ua.role, s.staff_id, s.first_name, s.last_name, 
                   s.license_number, s.phone_number, s.gender, cg.description AS gender_description,
                   ws.office_id, o.name AS office_name, o.address, o.city, o.state, o.zipcode, o.phone_number AS office_phone
            FROM user_account ua
            LEFT JOIN staff s ON s.staff_email = ua.email
            LEFT JOIN codes_gender cg ON s.gender = cg.code
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
            'phone' => $r['office_phone'] ?? null
        ];
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'profile' => [
            'staffId' => isset($r['staff_id']) ? (int) $r['staff_id'] : null,
            'firstName' => $r['first_name'] ?? $r['username'] ?? '',
            'lastName' => $r['last_name'] ?? '',
            'email' => $r['email'] ?? '',
            'phoneNumber' => $r['phone_number'] ?? '',
            'gender' => $r['gender_description'] ?? null,
            'licenseNumber' => $r['license_number'] ?? '',
            'role' => $r['role'] ?? 'receptionist',
            'workLocation' => $location
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
