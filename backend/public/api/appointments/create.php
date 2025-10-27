<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

// Simple API to create an appointment. Expects JSON body with:
// Patient_id, Doctor_id, Office_id, Appointment_date (YYYY-MM-DD HH:MM:SS), Reason_for_visit, booking_channel

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON body']);
        exit;
    }

    $required = ['Patient_id', 'Doctor_id', 'Office_id', 'Appointment_date', 'Reason_for_visit', 'booking_channel'];
    $missing = [];
    foreach ($required as $f) {
        if (!isset($input[$f]) || $input[$f] === '') $missing[] = $f;
    }
    if (!empty($missing)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing fields: ' . implode(', ', $missing)]);
        exit;
    }

    $conn = getDBConnection();
    $conn->begin_transaction();

    // Generate next appointment id
    $row = $conn->query("SELECT COALESCE(MAX(Appointment_id), 1000) + 1 as next_id FROM Appointment")->fetch_assoc();
    $next_id = (int)$row['next_id'];

    $stmt = $conn->prepare("INSERT INTO Appointment (Appointment_id, Patient_id, Doctor_id, Office_id, Appointment_date, Date_created, Reason_for_visit) VALUES (?, ?, ?, ?, ?, NOW(), ?)");
    if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);

    $stmt->bind_param('iiisss', $next_id, $input['Patient_id'], $input['Doctor_id'], $input['Office_id'], $input['Appointment_date'], $input['Reason_for_visit']);
    if (!$stmt->execute()) throw new Exception('Execute failed: ' . $stmt->error);

    $conn->commit();
    $stmt->close();
    closeDBConnection($conn);

    echo json_encode(['success' => true, 'appointment_id' => $next_id]);
    exit;

} catch (Exception $e) {
    if (isset($conn) && $conn->in_transaction) $conn->rollback();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>