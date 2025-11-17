<?php
// admin_api/users/staff_helpers.php

declare(strict_types=1);

function createStaffAndUser(
    mysqli $conn,
    array $payload,
    string $staffRole,  // "Doctor", "Nurse", "Receptionist"
    string $userRole    // "DOCTOR", "NURSE", "RECEPTIONIST"
): array {

    // Top-level trace
    error_log('createStaffAndUser: ENTER role=' . $staffRole . ' userRole=' . $userRole);
    error_log('createStaffAndUser: payload=' . json_encode($payload));

    // ---- Upfront payload validation -----------------------------------------
    $required = ['first_name', 'last_name', 'email', 'password', 'ssn', 'gender'];
    foreach ($required as $key) {
        if (!array_key_exists($key, $payload) || $payload[$key] === '' || $payload[$key] === null) {
            throw new InvalidArgumentException("Missing required field: {$key}");
        }
    }

    // Begin transaction so we don’t leave partial data if something fails
    $conn->begin_transaction();

    try {
        // --- 1) Insert into staff ------------------------------------------
        error_log('createStaffAndUser: preparing staff INSERT');

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
            error_log('createStaffAndUser: prepare staff failed: ' . $conn->error);
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
            error_log('createStaffAndUser: bind_param staff failed: ' . $stmt->error);
            throw new Exception('bind_param staff failed: ' . $stmt->error);
        }

        if (!$stmt->execute()) {
            error_log('createStaffAndUser: execute staff failed: ' . $stmt->error);
            throw new Exception('Execute staff failed: ' . $stmt->error);
        }

        $staffId = (int)$conn->insert_id;
        error_log('createStaffAndUser: staff INSERT OK, staff_id=' . $staffId);
        $stmt->close();

        // --- 2) Insert into user_account -----------------------------------
        error_log('createStaffAndUser: preparing user_account INSERT');

        $username     = strtolower(substr($staffRole, 0, 1)) . $staffId; // d205 / n101 / r501
        $passwordHash = password_hash($payload['password'], PASSWORD_BCRYPT);

        $sqlUser = "INSERT INTO user_account (
                        username,
                        email,
                        password_hash,
                        role,
                        mfa_enabled,
                        is_active
                    ) VALUES (?, ?, ?, ?, 0, 1)";

        $stmt = $conn->prepare($sqlUser);
        if (!$stmt) {
            error_log('createStaffAndUser: prepare user_account failed: ' . $conn->error);
            throw new Exception('Prepare user_account failed: ' . $conn->error);
        }

        $email    = $payload['email'];
        $roleEnum = $userRole;

        if (!$stmt->bind_param(
            'issss',
            $username,
            $email,
            $passwordHash,
            $roleEnum
        )) {
            error_log('createStaffAndUser: bind_param user_account failed: ' . $stmt->error);
            throw new Exception('bind_param user_account failed: ' . $stmt->error);
        }

        if (!$stmt->execute()) {
            error_log('createStaffAndUser: execute user_account failed: ' . $stmt->error);
            throw new Exception('Execute user_account failed: ' . $stmt->error);
        }
        $stmt->close();

        // --- 3) Optional weekly work_schedule from templates ----------------
        $workScheduleCode = $payload['work_schedule'] ?? null;
        error_log('createStaffAndUser: work_schedule_code=' . var_export($workScheduleCode, true));

        if (!empty($workScheduleCode)) {
            error_log('createStaffAndUser: entering schedule template block');

            $parts = explode('-', $workScheduleCode);

            if (count($parts) !== 3) {
                throw new Exception('Invalid work schedule format');
            }

            $officeId  = (int)$parts[0];
            $startTime = $parts[1];
            $endTime   = $parts[2];

            // Simple sanity check: start < end (valid HH:MM:SS strings)
            if ($startTime >= $endTime) {
                throw new Exception('Invalid work schedule time range: start_time must be < end_time');
            }

            error_log("createStaffAndUser: schedule lookup office_id=$officeId start=$startTime end=$endTime");

            $templateSql = "SELECT day_of_week, start_time, end_time
                            FROM work_schedule_templates
                            WHERE office_id  = ?
                              AND start_time = ?
                              AND end_time   = ?
                            ORDER BY FIELD(
                                day_of_week,
                                'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')";

            $templateStmt = $conn->prepare($templateSql);
            if (!$templateStmt) {
                error_log('createStaffAndUser: prepare template query failed: ' . $conn->error);
                throw new Exception('Prepare template query failed: ' . $conn->error);
            }

            if (!$templateStmt->bind_param('iss', $officeId, $startTime, $endTime)) {
                error_log('createStaffAndUser: bind_param template query failed: ' . $templateStmt->error);
                throw new Exception('bind_param template query failed: ' . $templateStmt->error);
            }

            if (!$templateStmt->execute()) {
                error_log('createStaffAndUser: execute template query failed: ' . $templateStmt->error);
                throw new Exception('Execute template query failed: ' . $templateStmt->error);
            }

            if (!method_exists($templateStmt, 'get_result')) {
                throw new Exception('mysqli_stmt::get_result() not available; check mysqlnd extension');
            }

            $templateResult = $templateStmt->get_result();
            if ($templateResult === false) {
                error_log('createStaffAndUser: get_result template query failed: ' . $templateStmt->error);
                throw new Exception('get_result template query failed: ' . $templateStmt->error);
            }

            if ($templateResult->num_rows === 0) {
                error_log('createStaffAndUser: no templates found for that office/time range');
                throw new Exception('No schedule templates found for selected office/time range');
            }

            $insertSql = "INSERT INTO work_schedule (
                            office_id,
                            staff_id,
                            start_time,
                            end_time,
                            day_of_week
                        ) VALUES (?, ?, ?, ?, ?)";

            $insertStmt = $conn->prepare($insertSql);
            if (!$insertStmt) {
                error_log('createStaffAndUser: prepare schedule insert failed: ' . $conn->error);
                throw new Exception('Prepare schedule insert failed: ' . $conn->error);
            }

            // Bind once, update variable values inside the loop
            $dayOfWeek = null;
            $tplStart  = null;
            $tplEnd    = null;

            if (!$insertStmt->bind_param(
                'iisss',
                $officeId,
                $staffId,
                $tplStart,
                $tplEnd,
                $dayOfWeek
            )) {
                error_log('createStaffAndUser: bind_param schedule insert failed: ' . $insertStmt->error);
                throw new Exception('bind_param schedule insert failed: ' . $insertStmt->error);
            }

            while ($tpl = $templateResult->fetch_assoc()) {
                $dayOfWeek = $tpl['day_of_week'];
                $tplStart  = $tpl['start_time'];
                $tplEnd    = $tpl['end_time'];

                error_log("createStaffAndUser: inserting schedule row staff_id=$staffId day=$dayOfWeek $tplStart-$tplEnd");

                if (!$insertStmt->execute()) {
                    error_log('createStaffAndUser: execute schedule insert failed: ' . $insertStmt->error);
                    throw new Exception('Execute schedule insert failed: ' . $insertStmt->error);
                }
            }

            $templateResult->free();
            $insertStmt->close();
            $templateStmt->close();
            error_log('createStaffAndUser: schedule inserts complete');
        } else {
            error_log('createStaffAndUser: no work_schedule_code, skipping schedule block');
        }

        error_log('createStaffAndUser: EXIT OK staff_id=' . $staffId . ' username=' . $username);

        // All good — commit transaction
        $conn->commit();

        return [
            'staff_id' => $staffId,
            'username' => $username,
        ];
    } catch (Throwable $e) {
        // Roll back any partial work
        $conn->rollback();
        error_log('createStaffAndUser: ERROR ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
        throw $e; // bubble up to add-doctor/add-nurse/add-receptionist
    }
}
