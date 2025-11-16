<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'ADMIN') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    // Expect JSON body
    $input = json_decode(file_get_contents('php://input'), true);

    $staffId    = $input['staff_id']    ?? null;
    $officeId   = $input['office_id']   ?? null;
    $dayOfWeek  = $input['day_of_week'] ?? null;

    // Optional custom times
    $customStartTime = $input['start_time'] ?? null;
    $customEndTime   = $input['end_time']   ?? null;

    if (!$staffId || !$officeId || !$dayOfWeek) {
        echo json_encode(['success' => false, 'error' => 'Missing parameters']);
        exit;
    }

    $conn = getDBConnection();

    // 1) Look up staff_role from staff table
    $roleQuery = "SELECT staff_role FROM staff WHERE staff_id = ?";
    $roleResult = executeQuery($conn, $roleQuery, 'i', [$staffId]);

    if (empty($roleResult)) {
        echo json_encode(['success' => false, 'error' => 'Staff member not found']);
        closeDBConnection($conn);
        exit;
    }

    // Normalize role (e.g., 'Nurse' -> 'NURSE')
    $role = strtoupper($roleResult[0]['staff_role'] ?? '');

    // 2) For NURSE / RECEPTIONIST: enforce single office
    if (in_array($role, ['NURSE', 'RECEPTIONIST'], true)) {
        // Check if they already have any schedule (which defines their office)
        $officeCheckQuery = "
            SELECT DISTINCT office_id
            FROM work_schedule
            WHERE staff_id = ?
            LIMIT 1
        ";
        $officeCheck = executeQuery($conn, $officeCheckQuery, 'i', [$staffId]);

        if (!empty($officeCheck)) {
            $assignedOfficeId = (int)$officeCheck[0]['office_id'];

            // If this new schedule is for a different office, reject
            if ($assignedOfficeId !== (int)$officeId) {
                echo json_encode([
                    'success' => false,
                    'error'   => 'This staff member is already assigned to a different office and cannot be scheduled at another location.'
                ]);
                closeDBConnection($conn);
                exit;
            }

            // Normalize officeId to their existing office
            $officeId = $assignedOfficeId;
        }
        // If no existing schedules, this office becomes their home base.
    }

    // 3) Get the template schedule for this office and day
    $templateQuery = "
        SELECT start_time, end_time
        FROM work_schedule_templates
        WHERE office_id = ?
          AND day_of_week = ?
        LIMIT 1
    ";

    $templateResults = executeQuery($conn, $templateQuery, 'is', [$officeId, $dayOfWeek]);

    if (empty($templateResults)) {
        echo json_encode([
            'success' => false,
            'error'   => 'Template schedule not found for this office and day'
        ]);
        closeDBConnection($conn);
        exit;
    }

    $template = $templateResults[0];

    // 4) Use custom times if provided, otherwise template times
    $startTime = $customStartTime ?? $template['start_time'];
    $endTime   = $customEndTime   ?? $template['end_time'];

    if ($startTime >= $endTime) {
        echo json_encode([
            'success' => false,
            'error'   => 'Start time must be before end time'
        ]);
        closeDBConnection($conn);
        exit;
    }

    // 5) Prevent overlapping schedules on the same day for this staff member
    //    (Doctors can do multiple offices, but no overlapping times.)
    //
    // Overlap condition:
    // NOT (existing_end <= new_start OR existing_start >= new_end)
    $conflictQuery = "
        SELECT schedule_id, office_id, start_time, end_time
        FROM work_schedule
        WHERE staff_id = ?
          AND day_of_week = ?
          AND NOT (end_time <= ? OR start_time >= ?)
        LIMIT 1
    ";

    $conflicts = executeQuery(
        $conn,
        $conflictQuery,
        'isss',
        [$staffId, $dayOfWeek, $startTime, $endTime]
    );

    if (!empty($conflicts)) {
        $c = $conflicts[0];
        echo json_encode([
            'success' => false,
            'error'   => sprintf(
                'Schedule conflicts with an existing shift on %s from %s to %s at office ID %d.',
                $dayOfWeek,
                $c['start_time'],
                $c['end_time'],
                $c['office_id']
            )
        ]);
        closeDBConnection($conn);
        exit;
    }

    $insertQuery = "
        INSERT INTO work_schedule (office_id, staff_id, day_of_week, start_time, end_time)
        VALUES (?, ?, ?, ?, ?)
    ";

    executeQuery(
        $conn,
        $insertQuery,
        'iisss',
        [$officeId, $staffId, $dayOfWeek, $startTime, $endTime]
    );

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'message' => 'Schedule added successfully'
    ]);
} catch (Exception $e) {
    error_log("Error in add_staff_schedule.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Database error: ' . $e->getMessage()
    ]);
}
