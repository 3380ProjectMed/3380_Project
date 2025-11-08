<?php
require_once __DIR__ . '/../_bootstrap.php';
// backend PDO helper is already loaded by bootstrap

try {
    $date = $_GET['date'] ?? date('Y-m-d');

    $params = [$date];
    $officeFilter = '';
    if (!empty($nurseOfficeId)) {
        $officeFilter = ' AND a.office_id = ?';
        $params[] = $nurseOfficeId;
    }

    // total
    $sqlTotal = "SELECT COUNT(*) AS cnt FROM appointment a WHERE DATE(a.appointment_date) = ?" . $officeFilter;
    $r = executeQuery($pdo, $sqlTotal, 's', $params);
    $total = isset($r[0]['cnt']) ? intval($r[0]['cnt']) : 0;

    // waiting
    $sqlWaiting = "SELECT COUNT(*) AS cnt FROM appointment a WHERE DATE(a.appointment_date) = ? AND a.status = 'Waiting'" . $officeFilter;
    $r = executeQuery($pdo, $sqlWaiting, 's', $params);
    $waiting = isset($r[0]['cnt']) ? intval($r[0]['cnt']) : 0;

    // upcoming (scheduled or in future)
    $sqlUpcoming = "SELECT COUNT(*) AS cnt FROM appointment a WHERE DATE(a.appointment_date) = ? AND (a.status = 'Scheduled' OR a.appointment_date > NOW())" . $officeFilter;
    $r = executeQuery($pdo, $sqlUpcoming, 's', $params);
    $upcoming = isset($r[0]['cnt']) ? intval($r[0]['cnt']) : 0;

    // completed
    $sqlCompleted = "SELECT COUNT(*) AS cnt FROM appointment a WHERE DATE(a.appointment_date) = ? AND a.status = 'Completed'" . $officeFilter;
    $r = executeQuery($pdo, $sqlCompleted, 's', $params);
    $completed = isset($r[0]['cnt']) ? intval($r[0]['cnt']) : 0;

    echo json_encode([
        'date' => $date,
        'totalAppointments' => $total,
        'waitingCount' => $waiting,
        'upcomingCount' => $upcoming,
        'completedCount' => $completed
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch stats', 'message' => $e->getMessage()]);
}
