<?php
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {

    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $conn = getDBConnection();
    if (isset($_GET['doctor_id'])) {
        $doctor_id = intval($_GET['doctor_id']);
    } else {
        $user_id = (int) $_SESSION['uid'];
        $rows = executeQuery($conn, 'SELECT d.doctor_id 
                        FROM user_account ua
                        JOIN staff s ON ua.user_id = s.staff_id
                        JOIN doctor d ON s.staff_id = d.staff_id
                        WHERE ua.user_id = ? 
                        LIMIT 1', 'i', [$user_id]);
        if (empty($rows)) {
            closeDBConnection($conn);
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'No doctor associated with the logged-in user']);
            exit;
        }
        $doctor_id = (int) $rows[0]['doctor_id'];
    }

    $month = isset($_GET['month']) ? intval($_GET['month']) : intval(date('m'));
    $year = isset($_GET['year']) ? intval($_GET['year']) : intval(date('Y'));

    if ($month < 1 || $month > 12) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid month']);
        exit;
    }
    if ($year < 1900 || $year > 3000) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid year']);
        exit;
    }

    $sql = "SELECT 
                a.Appointment_id,
                a.Appointment_date,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                p.patient_id,
                a.Reason_for_visit,
                o.office_id,
                o.name as office_name,
                (
                    SELECT GROUP_CONCAT(ca2.allergies_text SEPARATOR ', ')
                    FROM allergies_per_patient app2
                    JOIN codes_allergies ca2 ON app2.allergy_id = ca2.allergies_code
                    WHERE app2.patient_id = p.patient_id
                ) as allergies
            FROM appointment a
            INNER JOIN patient p ON a.Patient_id = p.patient_id
            LEFT JOIN office o ON a.Office_id = o.office_id
            
            WHERE a.Doctor_id = ?
            AND MONTH(a.Appointment_date) = ?
            AND YEAR(a.Appointment_date) = ?
            AND (a.Status IS NULL OR a.Status != 'Cancelled')
            ORDER BY a.Appointment_date";

    $appointments = executeQuery($conn, $sql, 'iii', [$doctor_id, $month, $year]);

    // Group by date
    $grouped = [];
    foreach ($appointments as $apt) {
        $date = date('Y-m-d', strtotime($apt['Appointment_date']));
        try {
            $dt = new DateTime($apt['Appointment_date']);
            $dt->setTimezone(new DateTimeZone('America/Chicago'));
            $date_chicago = $dt->format('Y-m-d');
        } catch (Exception $e) {
            $date_chicago = $date;
        }
        if (!isset($grouped[$date])) {
            $grouped[$date] = [];
        }

        $grouped[$date][] = [
            'id' => 'A' . str_pad($apt['Appointment_id'], 4, '0', STR_PAD_LEFT),
            'patientId' => 'P' . str_pad($apt['patient_id'], 3, '0', STR_PAD_LEFT),
            'patientName' => $apt['patient_name'],
            'appointment_date' => $apt['Appointment_date'],
            'appointment_time' => date('H:i', strtotime($apt['Appointment_date'])),
            'time' => date('g:i A', strtotime($apt['Appointment_date'])),
            'reason' => $apt['Reason_for_visit'] ?: 'General Visit',
            'location' => $apt['office_name'],
            'office_id' => isset($apt['office_id']) ? intval($apt['office_id']) : null,
            'allergies' => $apt['allergies'] ?: 'No Known Allergies',
            'date_only_chicago' => $date_chicago
        ];
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'month' => $month,
        'year' => $year,
        'appointments' => $grouped,
        'total_count' => count($appointments)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
