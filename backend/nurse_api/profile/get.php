<?php
require_once __DIR__ . '/../../lib/db.php';
require_once __DIR__ . '/../_bootstrap.php';

try {
    $rows = executeQuery(
        $pdo,
        "SELECT s.first_name, s.last_name, s.staff_email AS email,
                        s.work_location, s.license_number, s.staff_role
         FROM user_account u
         LEFT JOIN staff s ON s.staff_email = u.email
         WHERE u.user_id = ? LIMIT 1",
        'i',
        [$userId]
    );
    if (empty($rows)) { http_response_code(404); echo json_encode(['error'=>'Profile not found']); exit; }

    $r = $rows[0];
    echo json_encode([
        'firstName'     => $r['first_name'] ?? '',
        'lastName'      => $r['last_name'] ?? '',
        'email'         => $r['email'] ?? '',
        'department'    => $r['work_location'] ?? '',
        'licenseNumber' => $r['license_number'] ?? '',
        'role'          => $r['staff_role'] ?? 'NURSE'
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['message' => $e->getMessage()]);
}
