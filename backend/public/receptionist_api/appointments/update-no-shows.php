<?php

/**
 * Update appointments in two steps:
 * Step 1: Update 'Scheduled' appointments to 'Waiting' status if appointment time has passed
 * Step 2: Update 'Waiting' appointments to 'No-Show' status if they've been waiting 15+ minutes
 * 
 * This can be called periodically or triggered manually
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {
    // Require authentication
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }

    $conn = getDBConnection();
    $conn->begin_transaction();

    try {
        // STEP 1: Update Scheduled appointments to Waiting if appointment time has passed (but less than 15 min)
        // Only for appointments that haven't been checked in
        $updateToWaitingSql = "UPDATE appointment a
                               SET a.Status = 'Waiting'
                               WHERE a.Status = 'Scheduled'
                               AND DATE(a.Appointment_date) = CURDATE()
                               AND a.Appointment_date < NOW()
                               AND TIMESTAMPDIFF(MINUTE, a.Appointment_date, NOW()) < 15
                               AND NOT EXISTS (
                                   SELECT 1 FROM patient_visit pv 
                                   WHERE pv.appointment_id = a.Appointment_id 
                                   AND pv.start_at IS NOT NULL
                               )";
        
        $conn->query($updateToWaitingSql);
        $waitingCount = $conn->affected_rows;

        // STEP 2: Find Scheduled or Waiting appointments that should be marked as No-Show
        // Conditions:
        // 1. Status is 'Scheduled' or 'Waiting'
        // 2. Appointment time was more than 15 minutes ago
        // 3. Today's date
        // 4. Not checked in yet
        $findNoShowsSql = "SELECT 
                            a.Appointment_id,
                            a.Patient_id,
                            a.Doctor_id,
                            a.Appointment_date,
                            a.Status,
                            TIMESTAMPDIFF(MINUTE, a.Appointment_date, NOW()) as minutes_past
                        FROM appointment a
                        WHERE a.Status IN ('Scheduled', 'Waiting')
                        AND DATE(a.Appointment_date) = CURDATE()
                        AND TIMESTAMPDIFF(MINUTE, a.Appointment_date, NOW()) >= 15
                        AND NOT EXISTS (
                            SELECT 1 FROM patient_visit pv 
                            WHERE pv.appointment_id = a.Appointment_id 
                            AND pv.start_at IS NOT NULL
                        )
                        ORDER BY a.Appointment_date";

        $noShowAppointments = executeQuery($conn, $findNoShowsSql, '', []);

        $updatedToNoShow = [];
        
        // STEP 3: Update Waiting appointments to No-Show
        foreach ($noShowAppointments as $appointment) {
            $appointmentId = $appointment['Appointment_id'];
            
            // Update appointment status to No-Show
            $updateApptSql = "UPDATE appointment 
                             SET Status = 'No-Show'
                             WHERE Appointment_id = ?";
            executeQuery($conn, $updateApptSql, 'i', [$appointmentId]);
            
            // Update or create patient_visit record if it exists
            $checkVisitSql = "SELECT visit_id FROM patient_visit WHERE appointment_id = ?";
            $existingVisit = executeQuery($conn, $checkVisitSql, 'i', [$appointmentId]);
            
            if (!empty($existingVisit)) {
                // Update existing visit record
                $updateVisitSql = "UPDATE patient_visit 
                                  SET status = 'No-Show'
                                  WHERE appointment_id = ?";
                executeQuery($conn, $updateVisitSql, 'i', [$appointmentId]);
            }
            // Note: We don't create new patient_visit records for no-shows
            // to avoid triggering the insurance validation
            
            $updatedToNoShow[] = [
                'appointment_id' => $appointmentId,
                'patient_id' => $appointment['Patient_id'],
                'appointment_date' => $appointment['Appointment_date'],
                'minutes_past' => $appointment['minutes_past']
            ];
        }
        
        $conn->commit();
        closeDBConnection($conn);

        echo json_encode([
            'success' => true,
            'message' => $waitingCount . ' appointment(s) updated to Waiting, ' . count($updatedToNoShow) . ' appointment(s) updated to No-Show',
            'waiting_count' => $waitingCount,
            'no_show_count' => count($updatedToNoShow),
            'updated_count' => $waitingCount + count($updatedToNoShow),
            'waiting_appointments' => $waitingCount,
            'no_show_appointments' => $updatedToNoShow
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
