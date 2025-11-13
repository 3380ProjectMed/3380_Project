<?php
/**
 * Save vitals for an appointment (nurse)
 * Also updates patient_visit.blood_pressure and patient_visit.temperature
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

header('Content-Type: application/json');

try {
    session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $email = $_SESSION['email'] ?? '';
    if (empty($email)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'No session email']);
        exit;
    }

    $apptId = isset($_GET['apptId']) ? intval($_GET['apptId']) : 0;
    if ($apptId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'apptId required']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $bp = isset($input['bp']) ? trim($input['bp']) : null;
    $hr = isset($input['hr']) ? trim($input['hr']) : null;
    $temp = isset($input['temp']) ? trim($input['temp']) : null;
    $spo2 = isset($input['spo2']) ? trim($input['spo2']) : null;
    $height = isset($input['height']) ? trim($input['height']) : null;
    $weight = isset($input['weight']) ? trim($input['weight']) : null;

    $conn = getDBConnection();

    // Resolve nurse/staff for audit fields
    $nrows = executeQuery($conn, 'SELECT n.nurse_id, CONCAT(s.first_name, " ", s.last_name) AS nurse_name FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1', 's', [$email]);
    if (empty($nrows)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Nurse not found']);
        exit;
    }
    $nurse_id = (int)$nrows[0]['nurse_id'];
    $nurse_name = $nrows[0]['nurse_name'] ?? $email;

    // Upsert into vitals table (if exists), otherwise create
    $exists = executeQuery($conn, 'SELECT id FROM vitals WHERE appointment_id = ? LIMIT 1', 'i', [$apptId]);
    if (!empty($exists)) {
        // Update
        $sql = 'UPDATE vitals SET bp = ?, hr = ?, temp = ?, spo2 = ?, height = ?, weight = ?, recorded_by = ?, recorded_at = NOW() WHERE appointment_id = ?';
        executeQuery($conn, $sql, 'ssssssis', [$bp, $hr, $temp, $spo2, $height, $weight, $nurse_name, $apptId]);
    } else {
        // Insert
        $sql = 'INSERT INTO vitals (appointment_id, bp, hr, temp, spo2, height, weight, recorded_by, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())';
        executeQuery($conn, $sql, 'isssssss', [$apptId, $bp, $hr, $temp, $spo2, $height, $weight, $nurse_name]);
    }

    // Also update patient_visit blood_pressure and temperature so doctor APIs can read them
    if ($bp !== null || $temp !== null) {
        $updateSql = 'UPDATE patient_visit SET ';
        $parts = [];
        $params = [];
        $types = '';
        if ($bp !== null) { $parts[] = 'blood_pressure = ?'; $params[] = $bp; $types .= 's'; }
        if ($temp !== null) { $parts[] = 'temperature = ?'; $params[] = $temp; $types .= 's'; }
        // updated_by / last_updated
        $parts[] = 'last_updated = NOW()';
        $parts[] = 'updated_by = ?'; $params[] = $nurse_name; $types .= 's';

        $sql = $updateSql . implode(', ', $parts) . ' WHERE appointment_id = ?';
        $params[] = $apptId; $types .= 'i';

        executeQuery($conn, $sql, $types, $params);
    }

    closeDBConnection($conn);

    echo json_encode(['success' => true, 'message' => 'Vitals saved']);

} catch (Throwable $e) {
    if (isset($conn)) closeDBConnection($conn);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
