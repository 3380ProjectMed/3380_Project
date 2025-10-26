<?php
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    $conn = getDBConnection();
    $doctor_id = null;
    if (isset($_GET['doctor_id'])) {
        $doctor_id = intval($_GET['doctor_id']);
    } else {
        session_start();
        if (!isset($_SESSION['uid'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Not authenticated']);
            closeDBConnection($conn);
            exit;
        }
        $user_id = intval($_SESSION['uid']);
        $rows = executeQuery($conn, 'SELECT d.Doctor_id FROM Doctor d JOIN user_account ua ON ua.email = d.Email WHERE ua.user_id = ? LIMIT 1', 'i', [$user_id]);
        if (!is_array($rows) || count($rows) === 0) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'No doctor associated with user']);
            closeDBConnection($conn);
            exit;
        }
        $doctor_id = (int)$rows[0]['Doctor_id'];
    }
    
    $sql = "SELECT 
                r.Referral_ID,
                CONCAT(p.First_Name, ' ', p.Last_Name) as patient_name,
                p.Patient_ID,
                CONCAT(d2.First_Name, ' ', d2.Last_Name) as specialist_name,
                s.specialty_name,
                r.Reason,
                r.Status,
                r.Date_of_approval
            FROM Referral r
            INNER JOIN Patient p ON r.Patient_ID = p.Patient_ID
            LEFT JOIN Doctor d2 ON r.specialist_doctor_staff_id = d2.Doctor_id
            LEFT JOIN Specialty s ON d2.Specialty = s.specialty_id
            WHERE r.specialist_doctor_staff_id = ?
            ORDER BY r.Referral_ID DESC";
    
    $results = executeQuery($conn, $sql, 'i', [$doctor_id]);
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'referrals' => $results,
        'count' => count($results)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
