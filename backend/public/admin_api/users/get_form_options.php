<?php

declare(strict_types=1);

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../database.php';
require_once __DIR__ . '/../../session.php';

header('Content-Type: application/json');


if (empty($_SESSION['uid']) || ($_SESSION['role'] ?? '') !== 'ADMIN') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Admin access required']);
    exit;
}

try {
    $conn = getDBConnection();

    // ── Branch 1: schedules for a specific office ────────────────────────────
    if (isset($_GET['office_id']) && $_GET['office_id'] !== '') {
        $officeId = (int)$_GET['office_id'];

        $sql = "SELECT
                    t.office_id,
                    t.start_time,
                    t.end_time,
                    GROUP_CONCAT(
                        DISTINCT t.day_of_week
                        ORDER BY FIELD(
                            t.day_of_week,
                            'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'
                        )
                        SEPARATOR ', '
                    ) AS days
                FROM work_schedule_templates t
                WHERE t.office_id = ?
                GROUP BY t.office_id, t.start_time, t.end_time
                ORDER BY t.start_time, t.end_time";

        $rows = executeQuery($conn, $sql, 'i', [$officeId]);

        $workSchedules = [];
        foreach ($rows as $row) {
            $start = substr($row['start_time'], 0, 5);
            $end   = substr($row['end_time'],   0, 5);

            $label = sprintf(
                '%s (%s - %s)',
                $row['days'] ?: 'Days',
                $start,
                $end
            );

            $workSchedules[] = [
                'office_id'      => (int)$row['office_id'],
                'start_time'     => $row['start_time'],
                'end_time'       => $row['end_time'],
                'schedule_label' => $label,
            ];
        }

        echo json_encode([
            'success'        => true,
            'work_schedules' => $workSchedules,
        ]);
        exit;
    }

    // ── Branch 2: base form options (work locations, etc.) ───────────────────
    $locSql = "
        SELECT office_id, name, address
        FROM office
        ORDER BY name
    ";
    $locRows = executeQuery($conn, $locSql);

    $workLocations = array_map(static function ($row) {
        return [
            'office_id' => (int)$row['office_id'],
            'name'      => $row['name'],
            'address'   => $row['address'],
        ];
    }, $locRows);

    // Specialties
    $specSql  = "SELECT specialty_id, specialty_name AS name FROM specialty ORDER BY name";
    $specRows = executeQuery($conn, $specSql);

    $specialties = array_map(static function ($row) {
        return [
            'id'   => (int)$row['specialty_id'],
            'name' => $row['name'],
        ];
    }, $specRows);

    // Genders
    $genderSql = "
        SELECT gender_code, gender_text
        FROM codes_gender
        ORDER BY gender_text
    ";
    $genderRows = executeQuery($conn, $genderSql);

    $genders = array_map(static function ($row) {
        return [
            'id'     => (int)$row['gender_code'],
            'label'  => $row['gender_text'],
        ];
    }, $genderRows);

    closeDBConnection($conn);

    echo json_encode([
        'success'        => true,
        'work_locations' => $workLocations,
        'specialties'    => $specialties,
        'genders'        => $genders,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Error loading form options: ' . $e->getMessage(),
    ]);
}
