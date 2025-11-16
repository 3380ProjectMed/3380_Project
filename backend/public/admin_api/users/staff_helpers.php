<?php
// admin_api/users/staff_helpers.php

declare(strict_types=1);

function createStaffAndUser(
    mysqli $conn,
    array $payload,
    string $staffRole,  // "Doctor", "Nurse", "Receptionist"
    string $userRole    // "DOCTOR", "NURSE", "RECEPTIONIST"
): array {

    // --- 1) Insert into staff ----------------------------------------------
    $sqlStaff = "
        INSERT INTO staff (
            first_name,
            last_name,
            ssn,
            gender,
            staff_email,
            staff_role,
            license_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ";

    $stmt = $conn->prepare($sqlStaff);
    if (!$stmt) {
        throw new Exception('Prepare staff failed: ' . $conn->error);
    }

    $firstName     = $payload['first_name'];
    $lastName      = $payload['last_name'];
    $ssn           = $payload['ssn'];
    $gender        = (int)$payload['gender'];
    $staffEmail    = $payload['email'];
    $staffRoleStr  = $staffRole;
    $licenseNumber = $payload['license_number'] ?? null;

    if (!$stmt->bind_param(
        'sssisss',
        $firstName,
        $lastName,
        $ssn,
        $gender,
        $staffEmail,
        $staffRoleStr,
        $licenseNumber
    )) {
        throw new Exception('bind_param staff failed: ' . $stmt->error);
    }

    if (!$stmt->execute()) {
        throw new Exception('Execute staff failed: ' . $stmt->error);
    }

    $staffId = (int)$conn->insert_id;
    $stmt->close();

    // --- 2) Insert into user_account ---------------------------------------
    $username     = strtolower(substr($staffRole, 0, 1)) . $staffId; // d205 / n101 / r501
    $passwordHash = password_hash($payload['password'], PASSWORD_BCRYPT);

    $sqlUser = "
        INSERT INTO user_account (
            user_id,
            username,
            email,
            password_hash,
            role,
            mfa_enabled,
            is_active
        ) VALUES (?, ?, ?, ?, ?, 0, 1)
    ";

    $stmt = $conn->prepare($sqlUser);
    if (!$stmt) {
        throw new Exception('Prepare user_account failed: ' . $conn->error);
    }

    $userId   = $staffId;
    $email    = $payload['email'];
    $roleEnum = $userRole;

    if (!$stmt->bind_param(
        'issss',
        $userId,
        $username,
        $email,
        $passwordHash,
        $roleEnum
    )) {
        throw new Exception('bind_param user_account failed: ' . $stmt->error);
    }

    if (!$stmt->execute()) {
        throw new Exception('Execute user_account failed: ' . $stmt->error);
    }

    $stmt->close();

    // --- 3) Optional weekly work_schedule from templates --------------------
    $workScheduleCode = $payload['work_schedule'] ?? null;

    if (!empty($workScheduleCode)) {
        $parts = explode('-', $workScheduleCode);

        if (count($parts) !== 3) {
            throw new Exception('Invalid work schedule format');
        }

        $officeId  = (int)$parts[0];
        $startTime = $parts[1];
        $endTime   = $parts[2];

        $templateSql = "SELECT day_of_week, start_time, end_time
                        FROM work_schedule_templates
                        WHERE office_id  = ?
                        AND start_time = ?
                        AND end_time   = ?
                        ORDER BY FIELD(
                            day_of_week,
                            'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'
                        )";

        $templateStmt = $conn->prepare($templateSql);
        if (!$templateStmt) {
            throw new Exception('Prepare template query failed: ' . $conn->error);
        }

        if (!$templateStmt->bind_param('iss', $officeId, $startTime, $endTime)) {
            throw new Exception('bind_param template query failed: ' . $templateStmt->error);
        }

        if (!$templateStmt->execute()) {
            throw new Exception('Execute template query failed: ' . $templateStmt->error);
        }

        $templateResult = $templateStmt->get_result();
        if ($templateResult === false) {
            throw new Exception('get_result template query failed: ' . $templateStmt->error);
        }

        if ($templateResult->num_rows === 0) {
            throw new Exception('No schedule templates found for selected office/time range');
        }

        $insertSql = "
            INSERT INTO work_schedule (
                office_id,
                staff_id,
                days,
                start_time,
                end_time,
                day_of_week
            ) VALUES (?, ?, ?, ?, ?, ?)
        ";

        $insertStmt = $conn->prepare($insertSql);
        if (!$insertStmt) {
            throw new Exception('Prepare schedule insert failed: ' . $conn->error);
        }

        while ($tpl = $templateResult->fetch_assoc()) {
            $dayOfWeek = $tpl['day_of_week'];
            $tplStart  = $tpl['start_time'];
            $tplEnd    = $tpl['end_time'];

            if (!$insertStmt->bind_param(
                'iissss',
                $officeId,
                $staffId,
                $dayOfWeek,
                $tplStart,
                $tplEnd,
                $dayOfWeek
            )) {
                throw new Exception('bind_param schedule insert failed: ' . $insertStmt->error);
            }

            if (!$insertStmt->execute()) {
                throw new Exception('Execute schedule insert failed: ' . $insertStmt->error);
            }
        }

        $insertStmt->close();
        $templateStmt->close();
    }

    return [
        'staff_id' => $staffId,
        'username' => $username,
    ];
}
