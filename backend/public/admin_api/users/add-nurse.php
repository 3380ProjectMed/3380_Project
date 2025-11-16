<?php
declare(strict_types=1);

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../database.php';
require_once __DIR__ . '/../../staff_helpers.php';

header('Content-Type: application/json');

session_start();

if (empty($_SESSION['uid']) || ($_SESSION['role'] ?? '') !== 'ADMIN') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Admin access required']);
    exit;
}

try {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        throw new Exception('Invalid JSON payload');
    }

    $required = ['first_name', 'last_name', 'email', 'password', 'ssn', 'gender', 'work_location', 'work_schedule', 'department'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            throw new Exception("Missing required field: $field");
        }
    }

    $conn = getDBConnection();
    $conn->begin_transaction();

    // Parse work_schedule (format: "office_id-start_time-end_time")
    $scheduleParts = explode('-', $data['work_schedule']);
    if (count($scheduleParts) !== 3) {
        throw new Exception('Invalid work schedule format');
    }
    
    $officeId = (int)$scheduleParts[0];
    $startTime = $scheduleParts[1];
    $endTime = $scheduleParts[2];

    $payload = [
        'first_name'     => $data['first_name'],
        'last_name'      => $data['last_name'],
        'ssn'            => $data['ssn'],
        'gender'         => (int)$data['gender'],
        'email'          => $data['email'],
        'password'       => $data['password'],
        'work_location'  => $officeId,
        'work_schedule'  => null, // Will create multiple schedule entries
        'license_number' => $data['license_number'] ?? null,
    ];

    $staffResult = createStaffAndUser(
        $conn,
        $payload,
        'Nurse',
        'NURSE'
    );
    $staffId  = $staffResult['staff_id'];
    $username = $staffResult['username'];

    // Insert into nurse table
    $sqlNurse = "INSERT INTO nurse (staff_id, department) VALUES (?, ?)";
    $stmt = $conn->prepare($sqlNurse);
    if (!$stmt) {
        throw new Exception('Prepare nurse insert failed: ' . $conn->error);
    }

    $department = $data['department'];
    $stmt->bind_param('is', $staffId, $department);

    if (!$stmt->execute()) {
        throw new Exception('Execute nurse insert failed: ' . $stmt->error);
    }
    $stmt->close();

    // Create work_schedule entries based on templates for this office and time range
    $templateQuery = "
        SELECT day_of_week, start_time, end_time
        FROM work_schedule_templates
        WHERE office_id = ?
        AND start_time = ?
        AND end_time = ?
        ORDER BY CASE day_of_week
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
            WHEN 'Saturday' THEN 6
            WHEN 'Sunday' THEN 7
        END";
    
    $templateStmt = $conn->prepare($templateQuery);
    if (!$templateStmt) {
        throw new Exception('Prepare template query failed: ' . $conn->error);
    }
    
    $templateStmt->bind_param('iss', $officeId, $startTime, $endTime);
    $templateStmt->execute();
    $templateResult = $templateStmt->get_result();
    
    // Insert a work_schedule entry for each day
    $insertScheduleQuery = "
        INSERT INTO work_schedule (office_id, staff_id, days, start_time, end_time, day_of_week)
        VALUES (?, ?, ?, ?, ?, ?)";
    
    $insertScheduleStmt = $conn->prepare($insertScheduleQuery);
    if (!$insertScheduleStmt) {
        throw new Exception('Prepare schedule insert failed: ' . $conn->error);
    }
    
    $schedulesCreated = 0;
    while ($template = $templateResult->fetch_assoc()) {
        $dayOfWeek = $template['day_of_week'];
        $templateStartTime = $template['start_time'];
        $templateEndTime = $template['end_time'];
        
        $insertScheduleStmt->bind_param(
            'iissss',
            $officeId,
            $staffId,
            $dayOfWeek,
            $templateStartTime,
            $templateEndTime,
            $dayOfWeek
        );
        
        if (!$insertScheduleStmt->execute()) {
            throw new Exception('Execute schedule insert failed: ' . $insertScheduleStmt->error);
        }
        $schedulesCreated++;
    }
    
    $templateStmt->close();
    $insertScheduleStmt->close();

    if ($schedulesCreated === 0) {
        throw new Exception('No schedule templates found for selected office and time range');
    }

    $conn->commit();

    echo json_encode([
        'success'  => true,
        'message'  => 'Nurse created successfully with ' . $schedulesCreated . ' work schedules',
        'staff_id' => $staffId,
        'username' => $username,
    ]);
} catch (Exception $e) {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->rollback();
    }
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage(),
    ]);
}
?>