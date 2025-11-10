<?php
/**
 * SIMPLE VERSION - Search for visits that need payment
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

    $search = isset($_GET['search']) ? trim($_GET['search']) : '';

    if (strlen($search) < 2) {
        echo json_encode(['success' => true, 'visits' => []]);
        exit;
    }

    $conn = getDBConnection();

    // Search by patient name or appointment ID
    $sql = "SELECT 
                pv.visit_id,
                pv.patient_id,
                pv.appointment_id,
                pv.date as visit_date,
                pv.reason_for_visit,
                pv.payment,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name
            FROM patient_visit pv
            INNER JOIN patient p ON pv.patient_id = p.patient_id
            WHERE pv.status IN ('Checked In', 'Completed')
            AND (
                CONCAT(p.first_name, ' ', p.last_name) LIKE ?
                OR p.emergency_contact_id LIKE ?
                OR pv.appointment_id = ?
            )
            ORDER BY pv.date DESC
            LIMIT 10";

    $searchTerm = "%{$search}%";
    $appointmentId = is_numeric($search) ? (int) $search : 0;

    $visits = executeQuery($conn, $sql, 'ssi', [$searchTerm, $searchTerm, $appointmentId]);

    $results = [];
    if (is_array($visits)) {
        foreach ($visits as $v) {
            $results[] = [
                'visit_id' => $v['visit_id'],
                'patient_id' => $v['patient_id'],
                'patient_name' => $v['patient_name'],
                'appointment_id' => $v['appointment_id'],
                'visit_date' => $v['visit_date'],
                'reason' => $v['reason_for_visit'],
                'needs_payment' => true
            ];
        }
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'visits' => $results,
        'count' => count($results)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>