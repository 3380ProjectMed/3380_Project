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
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        throw new Exception('Invalid JSON payload');
    }

    // Doctors need work_location but NOT work_schedule (assigned later)
    $required = ['first_name', 'last_name', 'email', 'password', 'ssn', 'gender', 'work_location', 'license_number', 'specialty'];

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
        'work_location'  => (int)$data['work_location'], // Primary office location
        'work_schedule'  => null, // Doctors don't get a permanent schedule
        'license_number' => $data['license_number'],
    ];

    $staffResult = createStaffAndUser(
        $conn,
        $payload,
        'Doctor',
        'DOCTOR'
    );
    $staffId  = $staffResult['staff_id'];
    $username = $staffResult['username'];

    // The specialty field from frontend is the specialty name (text input)
    // We'll store it directly in the doctor table
    $specialtyName = $data['specialty'];

    // Insert into doctor table with specialty as VARCHAR (not looking up specialty_id)
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
        'message'  => 'Doctor created successfully',
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
?>