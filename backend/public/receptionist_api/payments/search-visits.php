<?php
header('Content-Type: application/json');
/**
 * Search for visits with payment filter option
 * filter=unpaid (default) - only show visits needing payment
 * filter=all - show all visits (including paid)
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';


try {
    //session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $filter = isset($_GET['filter']) ? $_GET['filter'] : 'unpaid'; // 'unpaid' or 'all'

    if (strlen($search) < 1) {
        echo json_encode(['success' => true, 'visits' => [], 'count' => 0]);
        exit;
    }

    $conn = getDBConnection();

    // Get receptionist's office
    $staffRows = executeQuery($conn, '
        SELECT ws.office_id
        FROM staff s
        JOIN user_account ua ON ua.email = s.staff_email
        JOIN work_schedule ws ON ws.staff_id = s.staff_id
        WHERE ua.user_id = ?
        LIMIT 1', 'i', [(int)$_SESSION['uid']]);

    if (empty($staffRows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No receptionist account found']);
        exit;
    }

    $office_id = (int)$staffRows[0]['office_id'];

    // Build query based on filter
    $sql = "SELECT 
                pv.visit_id,
                pv.patient_id,
                pv.appointment_id,
                pv.date as visit_date,
                pv.reason_for_visit,
                pv.payment,
                pv.payment_method,
                pv.copay_amount_due,
                pv.status,
                pv.last_updated,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                p.dob as patient_dob
            FROM patient_visit pv
            INNER JOIN patient p ON pv.patient_id = p.patient_id
            WHERE pv.office_id = ?
            AND pv.status IN ('Checked In', 'Scheduled', 'Completed')";

    // Add payment filter
    if ($filter === 'unpaid') {
        $sql .= " AND (pv.payment IS NULL OR pv.payment = 0)";
    }
    // If filter is 'all', don't add payment condition

    $sql .= " AND (
                CONCAT(p.first_name, ' ', p.last_name) LIKE ?
                OR pv.appointment_id = ?
            )
            ORDER BY pv.date DESC
            LIMIT 20";

    $searchTerm = "%{$search}%";
    $appointmentId = is_numeric($search) ? (int)$search : 0;

    $visits = executeQuery($conn, $sql, 'isi', [$office_id, $searchTerm, $appointmentId]);

    $results = [];
    if (is_array($visits)) {
        foreach ($visits as $v) {
            $payment = (float)($v['payment'] ?? 0);
            $isPaid = $payment > 0;

            $results[] = [
                'visit_id' => (int)$v['visit_id'],
                'patient_id' => (int)$v['patient_id'],
                'patient_name' => $v['patient_name'],
                'patient_dob' => $v['patient_dob'],
                'appointment_id' => $v['appointment_id'],
                'visit_date' => $v['visit_date'],
                'reason' => $v['reason_for_visit'],
                'status' => $v['status'],
                'payment' => $isPaid ? number_format($payment, 2) : null,
                'payment_method' => $v['payment_method'],
                'copay_amount' => $v['copay_amount_due'] ? number_format((float)$v['copay_amount_due'], 2) : null,
                'is_paid' => $isPaid,
                'needs_payment' => !$isPaid,
                'paid_date' => $isPaid ? $v['last_updated'] : null
            ];
        }
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'visits' => $results,
        'count' => count($results),
        'filter' => $filter
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
