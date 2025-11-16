<?php

declare(strict_types=1);

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../database.php';
require_once __DIR__ . '/../../staff_helpers.php';

header('Content-Type: application/json');

session_start();

// Require ADMIN
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

    // Doctors now also get an initial weekly schedule
    $required = [
        'first_name',
        'last_name',
        'email',
        'password',
        'ssn',
        'gender',
        'license_number',
        'specialty'
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
        'license_number' => $data['license_number'] ?? null
    ];

    $staffResult = createStaffAndUser(
        $conn,
        $payload,
        'Doctor',
        'DOCTOR'
    );
    $staffId  = $staffResult['staff_id'];
    $username = $staffResult['username'];

    // Store specialty name directly in doctor table
    $specialtyName = $data['specialty'];

    $sqlDoctor = "
        INSERT INTO doctor (staff_id, specialty, phone)
        VALUES (?, ?, ?)
    ";

    $stmt = $conn->prepare($sqlDoctor);
    if (!$stmt) {
        throw new Exception('Prepare doctor insert failed: ' . $conn->error);
    }

    $phone = $data['phone_number'] ?? null;
    $stmt->bind_param('iss', $staffId, $specialtyName, $phone);

    if (!$stmt->execute()) {
        throw new Exception('Execute doctor insert failed: ' . $stmt->error);
    }
    $stmt->close();

    $conn->commit();

    echo json_encode([
        'success'  => true,
        'message'  => 'Doctor created successfully with weekly schedule',
        'staff_id' => $staffId,
        'username' => $username,
    ]);
} catch (Exception $e) {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->rollback();
    }
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage(),
    ]);
}
