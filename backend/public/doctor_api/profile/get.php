<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    if (empty($_SESSION['uid']) || empty($_SESSION['role'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $conn = getDBConnection();

    $logged_in_doctor_id = null;
    if ($_SESSION['role'] === 'DOCTOR') {
        $staff_id = (int) $_SESSION['uid'];
        $rows = executeQuery(
            $conn,
            'SELECT doctor_id FROM doctor WHERE staff_id = ? LIMIT 1',
            'i',
            [$staff_id]
        );
        if (!empty($rows)) {
            $logged_in_doctor_id = (int) $rows[0]['doctor_id'];
        }
    }

    if (isset($_GET['doctor_id'])) {
        $requested_doctor_id = intval($_GET['doctor_id']);

        if ($_SESSION['role'] === 'DOCTOR' && $requested_doctor_id !== $logged_in_doctor_id) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Cannot view other doctor profiles']);
            exit;
        }

        $doctor_id = $requested_doctor_id;
    } else {
        if ($_SESSION['role'] !== 'DOCTOR' || !$logged_in_doctor_id) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Doctor access required']);
            exit;
        }

        $doctor_id = $logged_in_doctor_id;
    }

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
        throw new Exception('Doctor not found');
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
            'bio' => '',
            'phone' => $doctor['phone_number'] ?? ''
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
