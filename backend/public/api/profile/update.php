<?php
/**
 * Update doctor profile
 * Expects JSON body with fields: firstName, lastName, email, phone, licenseNumber
 */

require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    $conn = getDBConnection();

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) throw new Exception('Invalid JSON body');

    $doctor_id = isset($input['doctor_id']) ? intval($input['doctor_id']) : (isset($_GET['doctor_id']) ? intval($_GET['doctor_id']) : 201);

    // Validate required fields (at least one field to update)
    $allowed = ['firstName','lastName','email','phone','licenseNumber'];
    $updates = [];
    $params = [];
    $types = '';
    if (isset($input['firstName'])) { $updates[] = 'First_Name = ?'; $params[] = $input['firstName']; $types .= 's'; }
    if (isset($input['lastName'])) { $updates[] = 'Last_Name = ?'; $params[] = $input['lastName']; $types .= 's'; }
    if (isset($input['email'])) { $updates[] = 'Email = ?'; $params[] = $input['email']; $types .= 's'; }
    if (isset($input['phone'])) { $updates[] = 'Phone = ?'; $params[] = $input['phone']; $types .= 's'; }
    if (isset($input['licenseNumber'])) { $updates[] = 'License_Number = ?'; $params[] = $input['licenseNumber']; $types .= 's'; }

    if (empty($updates)) {
        throw new Exception('No updatable fields provided');
    }

    $sql = 'UPDATE Doctor SET ' . implode(', ', $updates) . ' WHERE Doctor_id = ?';
    $params[] = $doctor_id;
    $types .= 'i';

    $stmt = $conn->prepare($sql);
    if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);
    $stmt->bind_param($types, ...$params);
    if (!$stmt->execute()) throw new Exception('Execute failed: ' . $stmt->error);

    $stmt->close();
    closeDBConnection($conn);

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
