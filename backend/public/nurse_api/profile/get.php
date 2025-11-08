<?php
declare(strict_types=1);
header('Content-Type: application/json');
require_once __DIR__ . '/../_bootstrap.php';

function fail(int $code, string $msg, array $extra = []): void {
  http_response_code($code);
  echo json_encode(array_merge(['error' => $msg], $extra));
  exit;
}

try {
    $sql = "SELECT ua.username, ua.email, ua.role, s.first_name, s.last_name, s.license_number, s.work_location AS office_id, n.department, o.name AS office_name, o.address, o.city, o.state, o.zipcode
            FROM user_account ua
            LEFT JOIN staff s ON s.staff_email = ua.email
            LEFT JOIN nurse n ON n.staff_id = s.staff_id
            LEFT JOIN office o ON o.office_id = s.work_location
            WHERE ua.user_id = ? LIMIT 1";

    $rows = executeQuery($pdo, $sql, 'i', [$userId]);
    if (empty($rows)) fail(404, 'Profile not found');

    $r = $rows[0];
    $location = null;
    if (!empty($r['office_id'])) {
        $location = [
            'officeId' => (int)$r['office_id'],
            'name' => $r['office_name'] ?? null,
            'address' => $r['address'] ?? null,
            'city' => $r['city'] ?? null,
            'state' => $r['state'] ?? null,
            'zipcode' => $r['zipcode'] ?? null,
        ];
    }

    echo json_encode([
        'firstName' => $r['first_name'] ?? $r['username'] ?? '',
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
