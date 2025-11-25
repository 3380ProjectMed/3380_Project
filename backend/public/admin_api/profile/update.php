<?php

/**
 * Update doctor profile
 * Updates staff table for personal info and doctor table for specialty
 * Expects JSON body with fields: firstName, lastName, email, phone, licenseNumber, specialty
 */

require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
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

    // Resolve doctor_id and staff_id
    if (isset($input['doctor_id'])) {
        $doctor_id = intval($input['doctor_id']);
        // Get staff_id from doctor_id
        $result = executeQuery($conn, 'SELECT staff_id FROM doctor WHERE doctor_id = ? LIMIT 1', 'i', [$doctor_id]);
        if (empty($result)) {
            closeDBConnection($conn);
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Doctor not found']);
            exit;
        }
        $staff_id = (int)$result[0]['staff_id'];
    } elseif (isset($_GET['doctor_id'])) {
        $doctor_id = intval($_GET['doctor_id']);
        // Get staff_id from doctor_id
        $result = executeQuery($conn, 'SELECT staff_id FROM doctor WHERE doctor_id = ? LIMIT 1', 'i', [$doctor_id]);
        if (empty($result)) {
            closeDBConnection($conn);
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Doctor not found']);
            exit;
        }
        $staff_id = (int)$result[0]['staff_id'];
    } else {
        // Get doctor info from logged-in user
        $user_id = (int)$_SESSION['uid'];

        // user_id = staff_id for doctors now
        $result = executeQuery(
            $conn,
            'SELECT d.doctor_id, s.staff_id 
             FROM doctor d 
             INNER JOIN staff s ON d.staff_id = s.staff_id 
             WHERE s.staff_id = ? LIMIT 1',
            'i',
            [$user_id]
        );

        if (empty($result)) {
            closeDBConnection($conn);
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'No doctor record associated with logged-in user']);
            exit;
        }
        $doctor_id = (int)$result[0]['doctor_id'];
        $staff_id = (int)$result[0]['staff_id'];
    }

    // Start transaction
    $conn->begin_transaction();

    try {
        // Update staff table (personal info)
        $staff_updates = [];
        $staff_params = [];
        $staff_types = '';

        if (isset($input['firstName'])) {
            $staff_updates[] = 'first_name = ?';
            $staff_params[] = $input['firstName'];
            $staff_types .= 's';
        }
        if (isset($input['lastName'])) {
            $staff_updates[] = 'last_name = ?';
            $staff_params[] = $input['lastName'];
            $staff_types .= 's';
        }
        if (isset($input['email'])) {
            // Check if email already exists for another staff member
            $check = executeQuery(
                $conn,
                'SELECT staff_id FROM staff WHERE staff_email = ? AND staff_id != ? LIMIT 1',
                'si',
                [$input['email'], $staff_id]
            );
            if (!empty($check)) {
                throw new Exception('Email already in use by another staff member');
            }
            $staff_updates[] = 'staff_email = ?';
            $staff_params[] = $input['email'];
            $staff_types .= 's';
        }
        if (isset($input['licenseNumber'])) {
            $staff_updates[] = 'license_number = ?';
            $staff_params[] = $input['licenseNumber'];
            $staff_types .= 's';
        }

        // Update staff table if there are changes
        if (!empty($staff_updates)) {
            $sql = 'UPDATE staff SET ' . implode(', ', $staff_updates) . ' WHERE staff_id = ?';
            $staff_params[] = $staff_id;
            $staff_types .= 'i';

            $stmt = $conn->prepare($sql);
            if (!$stmt) throw new Exception('Staff prepare failed: ' . $conn->error);
            $stmt->bind_param($staff_types, ...$staff_params);
            if (!$stmt->execute()) throw new Exception('Staff update failed: ' . $stmt->error);
            $stmt->close();
        }

        // Update doctor table
        if (isset($input['specialty'])) {
            $stmt = $conn->prepare('UPDATE doctor SET specialty = ? WHERE doctor_id = ?');
            if (!$stmt) throw new Exception('Doctor prepare failed: ' . $conn->error);

            $specialty_id = intval($input['specialty']);
            $stmt->bind_param('ii', $specialty_id, $doctor_id);
            if (!$stmt->execute()) throw new Exception('Doctor update failed: ' . $stmt->error);
            $stmt->close();
        }

        // If email changed, update user_account table too
        if (isset($input['email'])) {
            $stmt = $conn->prepare('UPDATE user_account SET email = ?, updated_at = NOW() WHERE user_id = ?');
            if (!$stmt) throw new Exception('User account prepare failed: ' . $conn->error);
            $stmt->bind_param('si', $input['email'], $staff_id);
            if (!$stmt->execute()) throw new Exception('User account update failed: ' . $stmt->error);
            $stmt->close();
        }

        // Commit transaction
        $conn->commit();

        closeDBConnection($conn);
        echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
} catch (Exception $e) {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
