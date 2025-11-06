<?php
// nurse_api/schedule/get-today.php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';
header('Content-Type: application/json');

try {
    session_start();
    if (empty($_SESSION['uid'])) {
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

            // Resolve nurse_id from session email
            $email = $_SESSION['email'] ?? '';
            if (empty($email)) {
                closeDBConnection($conn);
                http_response_code(401);
                echo json_encode(['error' => 'UNAUTHENTICATED', 'message' => 'Please sign in']);
                exit;
            }

            $rows = executeQuery($conn, "SELECT n.nurse_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1", 's', [$email]);
            if (empty($rows)) {
                closeDBConnection($conn);
                http_response_code(404);
                echo json_encode(['error' => 'NURSE_NOT_FOUND', 'message' => 'No nurse record is associated with this account.']);
                exit;
            }

            $nurse_id = (int)$rows[0]['nurse_id'];

            // Match doctor's schedule query pattern - include office info
            $sql = "SELECT 
                        ws.day_of_week,
                        ws.start_time,
                        ws.end_time,
                        o.office_id,
                        o.name as office_name,
                        o.address,
                        o.city,
                        o.state
                    FROM work_schedule ws
                    JOIN office o ON ws.office_id = o.office_id
                    WHERE ws.nurse_id = ? AND ws.days IS NULL
                    ORDER BY 
                        FIELD(ws.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')";

            $schedule = executeQuery($conn, $sql, 'i', [$nurse_id]);

            closeDBConnection($conn);
    
            echo json_encode([
                'success' => true,
                'nurse_id' => $nurse_id,
                'schedule' => $schedule
            ]);

        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['error' => 'DB_ERROR', 'message' => $e->getMessage()]);
            exit;
        }
        ?>
