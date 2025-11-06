<?php
    require_once __DIR__ . '/../../../cors.php';
    require_once __DIR__ . '/../../../database.php';
    header('Content-Type: application/json');

    try {
        session_start();
        if (empty($_SESSION['uid'])) {
            http_response_code(401);
            echo json_encode(['error' => 'UNAUTHENTICATED', 'message' => 'Please sign in']);
            exit;
        }

        $conn = getDBConnection();

        // Get nurse profile by joining nurse and staff tables
        $email = $_SESSION['email'] ?? '';
        if (empty($email)) {
            closeDBConnection($conn);
            http_response_code(401);
            echo json_encode(['error' => 'UNAUTHENTICATED', 'message' => 'Please sign in']);
            exit;
        }

        $sql = "SELECT 
                    n.nurse_id as nurseId,
                    s.first_name as firstName,
                    s.last_name as lastName,
                    s.staff_email as email,
                    n.department,
                    s.license_number as licenseNumber,
                    s.phone
                FROM nurse n
                JOIN staff s ON n.staff_id = s.staff_id
                WHERE s.staff_email = ?
                LIMIT 1";

        $rows = executeQuery($conn, $sql, 's', [$email]);
    
        if (empty($rows)) {
            closeDBConnection($conn);
            http_response_code(404);
            echo json_encode(['error' => 'NURSE_NOT_FOUND', 'message' => 'No nurse record found']);
            exit;
        }

        closeDBConnection($conn);
    
        echo json_encode($rows[0]);

    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['error' => 'DB_ERROR', 'message' => $e->getMessage()]);
        exit;
    }
?>
