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
    
    // Set timezone to match appointment times (US Central Time)
    // Note: Central Standard Time is UTC-6, Central Daylight Time is UTC-5
    // November is CST (Standard Time)
    $conn->query("SET time_zone = '-06:00'");
    
    $conn->begin_transaction();

    try {
        // DEBUG: Get current time info and system timezone
        $debugTimeSql = "SELECT 
                            NOW() as server_time, 
                            CURDATE() as server_date, 
                            @@session.time_zone as session_timezone,
                            @@global.time_zone as global_timezone,
                            UNIX_TIMESTAMP(NOW()) as unix_timestamp";
        $debugTimeResult = executeQuery($conn, $debugTimeSql, '', []);
        $timeDebug = $debugTimeResult[0] ?? null;
        
        // DEBUG: Get all today's appointments with time calculations
        $debugAppointmentsSql = "SELECT 
                                    a.Appointment_id,
                                    a.Patient_id,
                                    CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                                    a.Appointment_date,
                                    a.Status,
                                    NOW() as server_now,
                                    TIMESTAMPDIFF(MINUTE, a.Appointment_date, NOW()) as minutes_past,
                                    DATE(a.Appointment_date) as appt_date,
                                    CURDATE() as today,
                                    TIME(a.Appointment_date) as appt_time,
                                    CASE 
                                        WHEN DATE(a.Appointment_date) = CURDATE() THEN 'YES'
                                        ELSE 'NO'
                                    END as is_today,
                                    CASE 
                                        WHEN a.Appointment_date < NOW() THEN 'YES'
                                        ELSE 'NO'
                                    END as is_past,
                                    CASE 
                                        WHEN TIMESTAMPDIFF(MINUTE, a.Appointment_date, NOW()) >= 15 THEN 'YES'
                                        ELSE 'NO'
                                    END as is_past_15min,
                                    (SELECT COUNT(*) FROM patient_visit pv 
                                        WHERE pv.appointment_id = a.Appointment_id 
                                        AND pv.start_at IS NOT NULL) as is_checked_in
                                FROM appointment a
                                JOIN patient p ON a.Patient_id = p.Patient_ID
                                WHERE DATE(a.Appointment_date) = CURDATE()
                                ORDER BY a.Appointment_date";
        
        $debugAppointments = executeQuery($conn, $debugAppointmentsSql, '', []);
    
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
                            NOW() as server_now,
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
                'current_time' => $appointment['server_now'],
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
            'no_show_appointments' => $updatedToNoShow,
            'debug' => [
                'server_time' => $timeDebug['server_time'] ?? null,
                'server_date' => $timeDebug['server_date'] ?? null,
                'session_timezone' => $timeDebug['session_timezone'] ?? null,
                'global_timezone' => $timeDebug['global_timezone'] ?? null,
                'unix_timestamp' => $timeDebug['unix_timestamp'] ?? null,
                'all_todays_appointments' => $debugAppointments
            ]
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
