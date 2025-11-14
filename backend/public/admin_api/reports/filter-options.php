<?php
//filter-options.php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    //session_start();

    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    $conn = getDBConnection();

    $type = isset($_GET['type']) ? $_GET['type'] : '';

    $data = [];

    switch ($type) {
        case 'offices':
            $sql = "SELECT 
                        office_id, 
                        name,
                        CONCAT(city, ', ', state) as location
                    FROM office 
                    ORDER BY name";
            $data = executeQuery($conn, $sql, '', []);
            break;

        case 'doctors':
            $sql = "SELECT 
                        d.doctor_id AS doctor_id,
                        s.first_name AS first_name,
                        s.last_name AS last_name,
                        d.specialty,
                        CONCAT(s.first_name, ' ', s.last_name, ' - ', d.specialty) AS display_name
                    FROM doctor d
                    JOIN staff s ON d.staff_id = s.staff_id
                    JOIN user_account ua ON s.staff_id = ua.user_id
                    WHERE ua.is_active = 1
                    ORDER BY s.last_name, s.first_name";
            $data = executeQuery($conn, $sql, '', []);
            break;

        case 'insurances':
            $sql = "SELECT 
                        payer_id,
                        name,
                        payer_type
                    FROM insurance_payer 
                    ORDER BY name";
            $data = executeQuery($conn, $sql, '', []);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid type parameter. Use offices, doctors, or insurances'
            ]);
            closeDBConnection($conn);
            exit;
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'type' => $type,
        'data' => $data
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
