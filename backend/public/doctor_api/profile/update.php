<?php

/**
 * Update doctor profile
 * Accepts JSON body with optional fields: firstName, lastName, email, phone, licenseNumber
 * Updates `staff` for identity fields and `doctor` for phone.
 */

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    //session_start();
    if (empty($_SESSION['uid']) || empty($_SESSION['role'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if ($input === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON body']);
        exit;
    }

    $conn = getDBConnection();

    // Resolve requested doctor_id and enforce role-based restrictions
    $requested_doctor_id = null;
    if (isset($input['doctor_id'])) $requested_doctor_id = intval($input['doctor_id']);
    if (isset($_GET['doctor_id'])) $requested_doctor_id = intval($_GET['doctor_id']);

    $logged_in_doctor_id = null;
    if ($_SESSION['role'] === 'DOCTOR') {
        $staff_id = (int) $_SESSION['uid'];
        $rows = executeQuery($conn, 'SELECT doctor_id FROM doctor WHERE staff_id = ? LIMIT 1', 'i', [$staff_id]);
        if (!empty($rows)) $logged_in_doctor_id = (int)$rows[0]['doctor_id'];
    }

    if ($requested_doctor_id !== null) {
        // If a doctor requests, they may only update their own profile
        if ($_SESSION['role'] === 'DOCTOR' && $logged_in_doctor_id !== $requested_doctor_id) {
            closeDBConnection($conn);
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Doctors may only update their own profile']);
            exit;
        }
        // Admins/receptionists are allowed to update other doctors
        $doctor_id = $requested_doctor_id;
    } else {
        // No doctor_id provided: if logged-in doctor, use their id; otherwise require doctor_id
        if ($_SESSION['role'] === 'DOCTOR') {
            if (!$logged_in_doctor_id) {
                closeDBConnection($conn);
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Doctor profile not found for logged-in user']);
                exit;
            }
            $doctor_id = $logged_in_doctor_id;
        } else {
            closeDBConnection($conn);
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'doctor_id is required for this action']);
            exit;
        }
    }

    // Fetch staff_id for this doctor
    $rows = executeQuery($conn, 'SELECT staff_id FROM doctor WHERE doctor_id = ? LIMIT 1', 'i', [$doctor_id]);
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Doctor not found']);
        exit;
    }
    $staff_id = (int)$rows[0]['staff_id'];

    // Prepare updates: staff fields and doctor fields separately
    $staffUpdates = [];
    $staffParams = [];
    $staffTypes = '';

    if (isset($input['firstName'])) {
        $staffUpdates[] = 'first_name = ?';
        $staffParams[] = $input['firstName'];
        $staffTypes .= 's';
    }
    if (isset($input['lastName'])) {
        $staffUpdates[] = 'last_name = ?';
        $staffParams[] = $input['lastName'];
        $staffTypes .= 's';
    }
    if (isset($input['email'])) {
        $staffUpdates[] = 'staff_email = ?';
        $staffParams[] = $input['email'];
        $staffTypes .= 's';
    }
    if (isset($input['licenseNumber'])) {
        $staffUpdates[] = 'license_number = ?';
        $staffParams[] = $input['licenseNumber'];
        $staffTypes .= 's';
    }

    $doctorUpdates = [];
    $doctorParams = [];
    $doctorTypes = '';
    if (isset($input['phone'])) {
        $doctorUpdates[] = 'phone = ?';
        $doctorParams[] = $input['phone'];
        $doctorTypes .= 's';
    }

    // Execute staff update if needed
    if (!empty($staffUpdates)) {
        $sql = 'UPDATE staff SET ' . implode(', ', $staffUpdates) . ' WHERE staff_id = ?';
        $staffParams[] = $staff_id;
        $staffTypes .= 'i';
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new Exception('Prepare failed (staff): ' . $conn->error);
        $stmt->bind_param($staffTypes, ...$staffParams);
        if (!$stmt->execute()) throw new Exception('Execute failed (staff): ' . $stmt->error);
        $stmt->close();
    }

    // Execute doctor update if needed
    if (!empty($doctorUpdates)) {
        $sql = 'UPDATE doctor SET ' . implode(', ', $doctorUpdates) . ' WHERE doctor_id = ?';
        $doctorParams[] = $doctor_id;
        $doctorTypes .= 'i';
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new Exception('Prepare failed (doctor): ' . $conn->error);
        $stmt->bind_param($doctorTypes, ...$doctorParams);
        if (!$stmt->execute()) throw new Exception('Execute failed (doctor): ' . $stmt->error);
        $stmt->close();
    }

    // Return updated profile (reuse same shape as get.php)
    $sql = "SELECT 
                d.doctor_id,
                d.staff_id,
                s.first_name,
                s.last_name,
                s.staff_email,
                s.license_number,
                ws.office_id,
                o.name as work_location_name,
                sp.specialty_name,
                cg.gender_text as gender,
                d.phone as phone_number
            FROM doctor d
            INNER JOIN staff s ON d.staff_id = s.staff_id
            LEFT JOIN work_schedule ws ON s.staff_id = ws.staff_id
            LEFT JOIN specialty sp ON d.specialty = sp.specialty_id
            LEFT JOIN codes_gender cg ON s.gender = cg.gender_code
            LEFT JOIN office o ON ws.office_id = o.office_id
            WHERE d.doctor_id = ?";

    $result = executeQuery($conn, $sql, 'i', [$doctor_id]);
    if (empty($result)) {
        closeDBConnection($conn);
        throw new Exception('Doctor not found after update');
    }
    $doctor = $result[0];

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'profile' => [
            'doctorId' => $doctor['doctor_id'],
            'staffId' => $doctor['staff_id'],
            'firstName' => $doctor['first_name'],
            'lastName' => $doctor['last_name'],
            'email' => $doctor['staff_email'],
            'licenseNumber' => $doctor['license_number'] ?: 'Not provided',
            'workLocation' => $doctor['work_location_name'] ?: 'Not assigned',
            'specialties' => [$doctor['specialty_name']],
            'gender' => $doctor['gender'],
            'bio' => ''
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
