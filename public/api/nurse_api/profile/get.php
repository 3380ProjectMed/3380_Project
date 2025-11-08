<?php
require_once __DIR__ . '/../_bootstrap.php';

try {
    $sql = "SELECT ua.email AS email, s.first_name, s.last_name, s.department, s.license_number, s.work_location AS officeId,
                   o.name AS officeName, o.address AS officeAddress, o.city AS officeCity, o.state AS officeState, o.zipcode AS officeZip
            FROM user_account ua
            LEFT JOIN staff s ON s.staff_email = ua.email
            LEFT JOIN nurse n ON n.staff_id = s.staff_id
            LEFT JOIN office o ON o.office_id = s.work_location
            WHERE ua.user_id = ? LIMIT 1";

    $rows = executeQuery($pdo, $sql, 'i', [$userId]);
    if (empty($rows)) { http_response_code(404); echo json_encode(['error' => 'Profile not found']); exit; }

    $r = $rows[0];
    $location = null;
    if (!empty($r['officeId'])) {
        $location = [
            'officeId' => (int)$r['officeId'],
            'name' => $r['officeName'] ?? '',
            'address' => $r['officeAddress'] ?? '',
            'city' => $r['officeCity'] ?? '',
            'state' => $r['officeState'] ?? '',
            'zipcode' => $r['officeZip'] ?? ''
        ];
    }

    echo json_encode([
        'firstName' => $r['first_name'] ?? '',
        'lastName' => $r['last_name'] ?? '',
        'email' => $r['email'] ?? '',
        'department' => $r['department'] ?? '',
        'licenseNumber' => $r['license_number'] ?? '',
        'location' => $location
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load profile', 'message' => $e->getMessage()]);
}
