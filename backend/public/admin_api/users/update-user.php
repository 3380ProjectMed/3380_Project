<?php
// /admin_api/users/update-user.php
declare(strict_types=1);

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

header('Content-Type: application/json');

try {
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        throw new RuntimeException('Invalid JSON payload');
    }

    // user_id == staff_id
    $userId   = isset($input['user_id']) ? (int)$input['user_id'] : 0;
    $userType = strtoupper(trim($input['user_type'] ?? ''));

    if ($userId <= 0 || $userType === '') {
        throw new RuntimeException('Missing user_id or user_type');
    }

    $firstName = trim($input['first_name'] ?? '');
    $lastName  = trim($input['last_name'] ?? '');
    $email     = trim($input['email'] ?? '');
    $phone     = trim($input['phone_number'] ?? '');          // used for doctors
    $isActive  = isset($input['is_active']) ? (int)$input['is_active'] : 1;

    // Optional, if you want to allow updating these:
    $specialty   = isset($input['specialty']) ? (int)$input['specialty'] : null; // doctor.specialty (FK)
    $department  = trim($input['department'] ?? '');                              // nurse.department
    $licenseNo   = trim($input['license_number'] ?? '');                          // staff.license_number

    if ($firstName === '' || $lastName === '' || $email === '') {
        throw new RuntimeException('First name, last name, and email are required');
    }

    $conn = getDBConnection();
    $conn->begin_transaction();

    // 1) Update user_account core info (email + active)
    $sql = "
        UPDATE user_account
        SET email = ?, is_active = ?
        WHERE user_id = ? AND role = ?
    ";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new RuntimeException('Failed to prepare user_account update');
    }
    $stmt->bind_param('siis', $email, $isActive, $userId, $userType);
    if (!$stmt->execute()) {
        throw new RuntimeException('Failed to update user_account');
    }

    // 2) Update staff for ALL staff-based users
    // staff: staff_id, first_name, last_name, ssn, gender, staff_email, staff_role, license_number
    $sql = "
        UPDATE staff
        SET first_name = ?, last_name = ?, staff_email = ?
            " . ($licenseNo !== '' ? ", license_number = ?" : "") . "
        WHERE staff_id = ?
    ";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new RuntimeException('Failed to prepare staff update');
    }

    if ($licenseNo !== '') {
        $stmt->bind_param('ssssi', $firstName, $lastName, $email, $licenseNo, $userId);
    } else {
        $stmt->bind_param('sssi', $firstName, $lastName, $email, $userId);
    }

    if (!$stmt->execute()) {
        throw new RuntimeException('Failed to update staff');
    }

    // 3) Role-specific data
    if ($userType === 'DOCTOR') {
        // doctor: doctor_id, staff_id, specialty (FK), phone
        if ($specialty !== null && $specialty > 0) {
            // update phone + specialty, rely on FK to enforce validity
            $sql = "
                UPDATE doctor
                SET phone = ?, specialty = ?
                WHERE staff_id = ?
            ";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                throw new RuntimeException('Failed to prepare doctor update');
            }
            $stmt->bind_param('sii', $phone, $specialty, $userId);
        } else {
            // Only update phone, leave specialty as-is
            $sql = "
                UPDATE doctor
                SET phone = ?
                WHERE staff_id = ?
            ";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                throw new RuntimeException('Failed to prepare doctor update (phone only)');
            }
            $stmt->bind_param('si', $phone, $userId);
        }

        if (!$stmt->execute()) {
            throw new RuntimeException('Failed to update doctor');
        }
    } elseif ($userType === 'NURSE') {
        // nurse: nurse_id, staff_id, department
        if ($department !== '') {
            $sql = "
                UPDATE nurse
                SET department = ?
                WHERE staff_id = ?
            ";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                throw new RuntimeException('Failed to prepare nurse update');
            }
            $stmt->bind_param('si', $department, $userId);
            if (!$stmt->execute()) {
                throw new RuntimeException('Failed to update nurse');
            }
        }
    }

    $conn->commit();

    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->rollback();
    }
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage(),
    ]);
}
