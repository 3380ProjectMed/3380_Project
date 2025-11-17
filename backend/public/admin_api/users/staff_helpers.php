<?php
// admin_api/users/staff_helpers.php

declare(strict_types=1);

function createStaffAndUser(
    mysqli $conn,
    array $payload,
    string $staffRole,
    string $userRole
): array {



    // ---- Upfront payload validation -----------------------------------------
    $required = ['first_name', 'last_name', 'email', 'password', 'ssn', 'gender'];
    foreach ($required as $key) {
        if (!array_key_exists($key, $payload) || $payload[$key] === '' || $payload[$key] === null) {
            throw new InvalidArgumentException("Missing required field: {$key}");
        }
    }

    try {
        // ---------------------------------------------------------------------
        // 1) Insert into user_account FIRST (source of truth for the ID)
        // ---------------------------------------------------------------------

        $email        = $payload['email'];
        $passwordHash = password_hash($payload['password'], PASSWORD_BCRYPT);
        $roleEnum     = $userRole;

        // temporary username, we will update after we know user_id
        $tmpUsername = uniqid(strtolower(substr($staffRole, 0, 1)));

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

        if (!$stmt->bind_param(
            'ssss',
            $tmpUsername,
            $email,
            $passwordHash,
            $roleEnum
        )) {
            throw new Exception('bind_param user_account failed: ' . $stmt->error);
        }

        if (!$stmt->execute()) {
            throw new Exception('Execute user_account failed: ' . $stmt->error);
        }

        $userId = (int)$conn->insert_id;
        $stmt->close();

        // Now set the "nice" username like d101 / n205 / r501
        $username = strtolower(substr($staffRole, 0, 1)) . $userId;
        $stmt = $conn->prepare("UPDATE user_account SET username = ? WHERE user_id = ?");
        if (!$stmt) {
            throw new Exception('Prepare username UPDATE failed: ' . $conn->error);
        }
        if (!$stmt->bind_param('si', $username, $userId)) {
            throw new Exception('bind_param username UPDATE failed: ' . $stmt->error);
        }
        if (!$stmt->execute()) {
            throw new Exception('Execute username UPDATE failed: ' . $stmt->error);
        }
        $stmt->close();

        // ---------------------------------------------------------------------
        // 2) Insert into staff using SAME ID as staff_id
        // ---------------------------------------------------------------------

        $sqlStaff = "
            INSERT INTO staff (
                staff_id,
                first_name,
                last_name,
                ssn,
                gender,
                staff_email,
                staff_role,
                license_number
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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

        $staffId = $userId;  // shared PK with user_account

        if (!$stmt->bind_param(
            'isssisss',
            $staffId,
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

        $stmt->close();

        // ---------------------------------------------------------------------
        // 3) Optional weekly work_schedule from templates (unchanged logic)
        // ---------------------------------------------------------------------
        $workScheduleCode = $payload['work_schedule'] ?? null;

        if (!empty($workScheduleCode)) {

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
                throw new Exception('Prepare template query failed: ' . $conn->error);
            }

            if (!$templateStmt->bind_param('iss', $officeId, $startTime, $endTime)) {
                throw new Exception('bind_param template query failed: ' . $templateStmt->error);
            }

            if (!$templateStmt->execute()) {
                throw new Exception('Execute template query failed: ' . $templateStmt->error);
            }

            if (!method_exists($templateStmt, 'get_result')) {
                throw new Exception('mysqli_stmt::get_result() not available; check mysqlnd extension');
            }

            $templateResult = $templateStmt->get_result();
            if ($templateResult === false) {
                throw new Exception('get_result template query failed: ' . $templateStmt->error);
            }

            if ($templateResult->num_rows === 0) {
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
                throw new Exception('bind_param schedule insert failed: ' . $insertStmt->error);
            }

            while ($tpl = $templateResult->fetch_assoc()) {
                $dayOfWeek = $tpl['day_of_week'];
                $tplStart  = $tpl['start_time'];
                $tplEnd    = $tpl['end_time'];

                if (!$insertStmt->execute()) {
                    throw new Exception('Execute schedule insert failed: ' . $insertStmt->error);
                }
            }

            $templateResult->free();
            $insertStmt->close();
            $templateStmt->close();
        } else {
            error_log('createStaffAndUser: no work_schedule_code, skipping schedule block');
        }


        // All good — commit transaction

        return [
            'staff_id' => $staffId,   // == user_id
            'username' => $username,
        ];
    } catch (Throwable $e) {
        // Roll back any partial work
        error_log('createStaffAndUser: ERROR ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
        throw $e; // bubble up to add-doctor/add-nurse/add-receptionist
    }
}
