<?php

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {

    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }

    $conn = getDBConnection();

    $sql = "SELECT DISTINCT
                o.office_id,
                o.office_name,
                o.city,
                o.state,
                o.phone_number,
                COUNT(DISTINCT ws.staff_id) as doctor_count
            FROM office o
            LEFT JOIN work_schedule ws ON ws.office_id = o.office_id
            LEFT JOIN staff s ON s.staff_id = ws.staff_id AND s.role = 'Doctor'
            GROUP BY o.office_id, o.office_name, o.city, o.state, o.phone_number
            ORDER BY o.office_name";

    $result = executeQuery($conn, $sql, '', []);

    $offices = [];
    foreach ($result as $office) {
        $doctorsSql = "SELECT DISTINCT
                        d.doctor_id,
                        s.first_name,
                        s.last_name,
                        spec.specialty_name
                    FROM work_schedule ws
                    JOIN staff s ON s.staff_id = ws.staff_id
                    JOIN doctor d ON d.staff_id = s.staff_id
                    LEFT JOIN specialty spec ON spec.specialty_id = d.specialty_id
                    WHERE ws.office_id = ?
                    ORDER BY s.last_name, s.first_name";

        $doctors = executeQuery($conn, $doctorsSql, 'i', [$office['office_id']]);

        $offices[] = [
            'office_id' => (int)$office['office_id'],
            'office_name' => $office['office_name'],
            'city' => $office['city'],
            'state' => $office['state'],
            'phone_number' => $office['phone_number'],
            'doctor_count' => (int)$office['doctor_count'],
            'doctors' => $doctors
        ];
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'offices' => $offices
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}