<?php

/**
 * Cancel an appointment
 * Uses session-based authentication like doctor API
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    // Start session and require that the user is logged in
    //session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['Appointment_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Appointment_id is required']);
        exit;
    }

    $appointment_id = (int)$input['Appointment_id'];
    $cancellation_reason = $input['cancellation_reason'] ?? 'No reason provided';
    $user_id = (int)$_SESSION['uid'];

    $conn = getDBConnection();

    // Verify receptionist has access to this appointment (same office)
    $verifySql = "SELECT a.Appointment_id, a.Office_id
                  FROM appointment a
                  JOIN user_account ua ON ua.user_id = ?
                  JOIN staff s ON ua.email = s.staff_email
                  JOIN work_schedule ws ON ws.staff_id = s.staff_id AND ws.office_id = a.Office_id
                  WHERE a.Appointment_id = ?";

    $verifyResult = executeQuery($conn, $verifySql, 'ii', [$user_id, $appointment_id]);

    if (empty($verifyResult)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied or appointment not found']);
        exit;
    }

    $conn->begin_transaction();

    try {
        // Update appointment status to cancelled
        $updateApptSql = "UPDATE appointment 
                         SET Status = 'Cancelled'
                         WHERE Appointment_id = ?";
        executeQuery($conn, $updateApptSql, 'i', [$appointment_id]);

        // If a patient_visit record exists, update its status to Canceled
        // Don't create a new patient_visit for cancellations (avoids insurance trigger)
        $checkVisitSql = "SELECT visit_id FROM patient_visit WHERE appointment_id = ?";
        $existingVisit = executeQuery($conn, $checkVisitSql, 'i', [$appointment_id]);

        if (!empty($existingVisit)) {
            $updateVisitSql = "UPDATE patient_visit 
                              SET status = 'Canceled'
                              WHERE appointment_id = ?";
            executeQuery($conn, $updateVisitSql, 'i', [$appointment_id]);
        }
        // Note: We don't create a new patient_visit record for cancellations
        // This avoids triggering the insurance validation trigger

        $conn->commit();
        closeDBConnection($conn);

        echo json_encode([
            'success' => true,
            'message' => 'Appointment cancelled successfully',
            'cancellation_reason' => $cancellation_reason
        ]);
    } catch (Exception $ex) {
        $conn->rollback();
        closeDBConnection($conn);
        throw $ex;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
