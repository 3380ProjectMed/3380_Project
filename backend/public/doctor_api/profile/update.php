<?php

/**
 * Update doctor profile
 * Expects JSON body with fields: firstName, lastName, email, phone, licenseNumber
 */

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    //session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !is_array($input)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON body']);
        exit;
    }

    $conn = getDBConnection();

    // Resolve doctor_id: body overrides query param; if absent, resolve from logged-in user
    if (isset($input['doctor_id'])) {
        $doctor_id = intval($input['doctor_id']);
    } elseif (isset($_GET['doctor_id'])) {
        $doctor_id = intval($_GET['doctor_id']);
    } else {
        $user_id = (int)$_SESSION['uid'];
        $rows = executeQuery($conn, 'SELECT s.staff_id FROM staff s JOIN user_account ua ON ua.email = s.staff_email WHERE ua.user_id = ? LIMIT 1', 'i', [$user_id]);
        if (empty($rows)) {
            closeDBConnection($conn);
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'No doctor associated with the logged-in user']);
            exit;
        }
        $doctor_id = (int)$rows[0]['doctor_id'];
    }

    // Validate required fields (at least one field to update)
    $allowed = ['firstName', 'lastName', 'email', 'phone', 'licenseNumber'];
    $updates = [];
    $params = [];
    $types = '';
    if (isset($input['firstName'])) {
        $updates[] = 'first_name = ?';
        $params[] = $input['firstName'];
        $types .= 's';
    }
    if (isset($input['lastName'])) {
        $updates[] = 'last_name = ?';
        $params[] = $input['lastName'];
        $types .= 's';
    }
    if (isset($input['email'])) {
        $updates[] = 'email = ?';
        $params[] = $input['email'];
        $types .= 's';
    }
    if (isset($input['phone'])) {
        $updates[] = 'phone = ?';
        $params[] = $input['phone'];
        $types .= 's';
    }
    if (isset($input['licenseNumber'])) {
        $updates[] = 'license_number = ?';
        $params[] = $input['licenseNumber'];
        $types .= 's';
    }

    if (empty($updates)) {
        throw new Exception('No updatable fields provided');
    }

    $sql = 'UPDATE doctor SET ' . implode(', ', $updates) . ' WHERE doctor_id = ?';
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
