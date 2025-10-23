<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';


try {
    session_start();

    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $conn = getDBConnection();

    // Determine doctor_id: query param overrides, otherwise resolve from logged-in user
    if (isset($_GET['doctor_id'])) {
        $doctor_id = intval($_GET['doctor_id']);
    } else {
        $user_id = (int)$_SESSION['uid'];
        $rows = executeQuery($conn, 'SELECT d.Doctor_id FROM Doctor d JOIN user_account ua ON ua.email = d.Email WHERE ua.user_id = ? LIMIT 1', 'i', [$user_id]);
        if (empty($rows)) {
            closeDBConnection($conn);
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'No doctor associated with the logged-in user']);
            exit;
        }
        $doctor_id = (int)$rows[0]['Doctor_id'];
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
    
    // Get all appointments for the month
    $sql = "SELECT 
                a.Appointment_id,
                a.Appointment_date,
                CONCAT(p.First_Name, ' ', p.Last_Name) as patient_name,
                p.Patient_ID,
                a.Reason_for_visit,
                o.Office_ID as office_id,
                o.Name as office_name,
                ca.Allergies_Text as allergies
            FROM Appointment a
            INNER JOIN Patient p ON a.Patient_id = p.Patient_ID
            LEFT JOIN Office o ON a.Office_id = o.Office_ID
            LEFT JOIN CodesAllergies ca ON p.Allergies = ca.AllergiesCode
            WHERE a.Doctor_id = ?
            AND MONTH(a.Appointment_date) = ?
            AND YEAR(a.Appointment_date) = ?
            ORDER BY a.Appointment_date";
    
    $appointments = executeQuery($conn, $sql, 'iii', [$doctor_id, $month, $year]);
    
    // Group by date
    $grouped = [];
    foreach ($appointments as $apt) {
        $date = date('Y-m-d', strtotime($apt['Appointment_date']));
        if (!isset($grouped[$date])) {
            $grouped[$date] = [];
        }
        
        $grouped[$date][] = [
            'id' => 'A' . str_pad($apt['Appointment_id'], 4, '0', STR_PAD_LEFT),
            'patientId' => 'P' . str_pad($apt['Patient_ID'], 3, '0', STR_PAD_LEFT),
            'patientName' => $apt['patient_name'],
            // raw datetime for frontend parsing
            'appointment_date' => $apt['Appointment_date'],
            'appointment_time' => date('H:i', strtotime($apt['Appointment_date'])),
            'time' => date('g:i A', strtotime($apt['Appointment_date'])),
            'reason' => $apt['Reason_for_visit'] ?: 'General Visit',
            'location' => $apt['office_name'],
            'office_id' => isset($apt['office_id']) ? intval($apt['office_id']) : null,
            'allergies' => $apt['allergies'] ?: 'No Known Allergies'
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
?>