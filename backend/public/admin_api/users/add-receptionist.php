<?php

declare(strict_types=1);

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../database.php';
require_once __DIR__ . '/../../staff_helpers.php';
require_once __DIR__ . '/../../session.php';

header('Content-Type: application/json');


if (empty($_SESSION['uid']) || ($_SESSION['role'] ?? '') !== 'ADMIN') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Admin access required']);
    exit;
}

try {
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        throw new Exception('Invalid JSON payload');
    }

    $required = [
        'first_name',
        'last_name',
        'email',
        'password',
        'ssn',
        'gender',
        'work_location',
        'work_schedule'
    ];

    foreach ($required as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            throw new Exception("Missing required field: $field");
        }
    }

    $conn = getDBConnection();
    $conn->begin_transaction();

    $payload = [
        'first_name'     => $data['first_name'],
        'last_name'      => $data['last_name'],
        'ssn'            => $data['ssn'],
        'gender'         => (int)$data['gender'],
        'email'          => $data['email'],
        'password'       => $data['password'],
        'license_number' => $data['license_number'] ?? null,
        'work_location'  => (int)$data['work_location'],
        'work_schedule'  => $data['work_schedule'], // officeId-start-end
    ];

    $staffResult = createStaffAndUser(
        $conn,
        $payload,
        'Receptionist',
        'RECEPTIONIST'
    );
    $staffId  = $staffResult['staff_id'];
    $username = $staffResult['username'];

    // No extra receptionist table – everything is in staff/user_account & schedule

    $conn->commit();

    echo json_encode([
        'success'  => true,
        'message'  => 'Receptionist created successfully with weekly schedule',
        'staff_id' => $staffId,
        'username' => $username,
    ]);
} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->rollback();
    }

    // Log to server logs so you can see the real stack trace in Kudu / log stream
    error_log('add-receptionist.php error: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Server error: ' . $e->getMessage(),
    ]);
}
