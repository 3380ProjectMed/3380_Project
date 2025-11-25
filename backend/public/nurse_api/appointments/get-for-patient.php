<?php
header('Content-Type: application/json');
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';


try {
    //session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'UNAUTHENTICATED']);
        exit;
    }

    $conn = getDBConnection();

    // validate patient_id
    $patient_id = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;
    if ($patient_id <= 0) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'patient_id required']);
        exit;
    }

    $scope = isset($_GET['scope']) ? strtolower(trim($_GET['scope'])) : 'today';

    if ($scope === 'today') {
        $sql = "SELECT 
        a.Appointment_id, a.Appointment_date, a.Status, a.Reason_for_visit, o.name AS office_name, o.address AS office_address, o.city AS office_city, o.state AS office_state 
        FROM appointment a LEFT JOIN office o ON a.Office_id = o.office_id 
        WHERE a.Patient_id = ? AND DATE(a.Appointment_date) = CURDATE() 
        ORDER BY a.Appointment_date";
        $appointments = executeQuery($conn, $sql, 'i', [$patient_id]);
    } else {
        // upcoming: today or future
        $sql = "SELECT a.Appointment_id, a.Appointment_date, a.Status, a.Reason_for_visit, o.name AS office_name, o.address AS office_address, o.city AS office_city, o.state AS office_state 
        FROM appointment a LEFT JOIN office o ON a.Office_id = o.office_id 
        WHERE a.Patient_id = ? AND DATE(a.Appointment_date) >= CURDATE() 
        ORDER BY a.Appointment_date";
        $appointments = executeQuery($conn, $sql, 'i', [$patient_id]);
    }

    closeDBConnection($conn);

    echo json_encode(['success' => true, 'appointments' => $appointments]);
} catch (Throwable $e) {
    if (isset($conn)) closeDBConnection($conn);
    http_response_code(500);
    error_log('[nurse_api] get-for-patient.php error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'INTERNAL_ERROR', 'message' => $e->getMessage()]);
}
