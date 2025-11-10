<?php
/**
 * Search for visits that need payment
 * Fixed to properly search by patient name or appointment ID
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

    // Return empty results if search is too short
    if (strlen($search) < 1) {
        echo json_encode(['success' => true, 'visits' => [], 'count' => 0]);
        exit;
    }

    $conn = getDBConnection();

    // Get receptionist's office to limit results
    $staffRows = executeQuery($conn, '
        SELECT s.work_location as office_id
        FROM staff s
        JOIN user_account ua ON ua.email = s.staff_email
        WHERE ua.user_id = ?', 'i', [(int)$_SESSION['uid']]);
    
    if (empty($staffRows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No receptionist account found']);
        exit;
    }
    
    $office_id = (int)$staffRows[0]['office_id'];

    // Search by patient name or appointment ID
    // Only show visits that haven't been fully paid yet
    $sql = "SELECT 
                pv.visit_id,
                pv.patient_id,
                pv.appointment_id,
                pv.date as visit_date,
                pv.reason_for_visit,
                pv.payment,
                pv.amount_due,
                pv.total_due,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                p.dob as patient_dob,
                CONCAT(doc_staff.first_name, ' ', doc_staff.last_name) as doctor_name
            FROM patient_visit pv
            INNER JOIN patient p ON pv.patient_id = p.patient_id
            LEFT JOIN doctor d ON pv.doctor_id = d.doctor_id
            LEFT JOIN staff doc_staff ON d.staff_id = doc_staff.staff_id
            WHERE pv.office_id = ?
            AND pv.status IN ('Checked In', 'Completed')
            AND (pv.payment IS NULL OR pv.payment = 0 OR pv.total_due > 0)
            AND (
                CONCAT(p.first_name, ' ', p.last_name) LIKE ?
                OR pv.appointment_id = ?
            )
            ORDER BY pv.date DESC
            LIMIT 10";

    $searchTerm = "%{$search}%";
    $appointmentId = is_numeric($search) ? (int)$search : 0;

    $visits = executeQuery($conn, $sql, 'isi', [$office_id, $searchTerm, $appointmentId]);

    $results = [];
    if (is_array($visits)) {
        foreach ($visits as $v) {
            $results[] = [
                'visit_id' => (int)$v['visit_id'],
                'patient_id' => (int)$v['patient_id'],
                'patient_name' => $v['patient_name'],
                'patient_dob' => $v['patient_dob'],
                'appointment_id' => $v['appointment_id'],
                'visit_date' => $v['visit_date'],
                'reason' => $v['reason_for_visit'],
                'doctor_name' => $v['doctor_name'],
                'needs_payment' => true,
                'current_payment' => $v['payment'] ? number_format((float)$v['payment'], 2) : '0.00'
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
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>