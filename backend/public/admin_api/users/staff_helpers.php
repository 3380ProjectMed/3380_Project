<?php
// admin_api/users/staff_helpers.php

declare(strict_types=1);

function createStaffAndUser(
    mysqli $conn,
    array $payload,
    string $staffRole,
    string $userRole
): array {
    // --- 1) Insert into staff ----------------------------------------------
    $sqlStaff = "INSERT INTO staff (first_name, last_name, ssn, gender, staff_email, staff_role, license_number)
                    VALUES (
                        ?, ?, ?, ?, ?, ?, NULL, ?)";

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
        'sssisss', // first_name, last_name, ssn, gender, staff_email, staff_role, license_number
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

    // --- 2) Insert into user_account (user_id = staff_id) -------------------
    $username     = strtolower(substr($staffRole, 0, 1)) . $staffId; // d205 / n101 / r501
    $passwordHash = password_hash($payload['password'], PASSWORD_BCRYPT);

    $sqlUser = "INSERT INTO user_account (user_id, username, email, password_hash, role, mfa_enabled, is_active) 
                    VALUES (?, ?, ?, ?, ?, 0, 1)";

    $stmt = $conn->prepare($sqlUser);
    if (!$stmt) {
        throw new Exception('Prepare user_account failed: ' . $conn->error);
    }

    $userId   = $staffId;
    $email    = $payload['email'];
    $roleEnum = $userRole;

    if (!$stmt->bind_param(
        'issss', // user_id, username, email, password_hash, role
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

    // --- 3) Optional work_schedule row -------------------------------------
    $workScheduleCode = $payload['work_schedule'] ?? null;

    return [
        'staff_id' => $staffId,
        'username' => $username,
    ];
}
