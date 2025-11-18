<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/patients/get-patient-insurance.php
 * ==========================================
 * Get patient's current insurance information (including expired)
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {
    //session_start();
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $patient_id = isset($_GET['patient_id']) ? (int)$_GET['patient_id'] : 0;

    if ($patient_id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid patient ID required']);
        exit;
    }

    $conn = getDBConnection();

    // Get patient's primary insurance (including expired)
    $sql = "SELECT 
                pi.id,
                pi.patient_id,
                pi.plan_id,
                pi.member_id,
                pi.group_id,
                pi.effective_date,
                pi.expiration_date,
                pi.is_primary,
                ip.plan_name,
                ip.plan_type,
                ip.payer_id,
                ipy.name as payer_name,
                CASE
                    WHEN pi.expiration_date IS NULL THEN 'ACTIVE'
                    WHEN pi.expiration_date < CURDATE() THEN 'EXPIRED'
                    WHEN pi.expiration_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'EXPIRING_SOON'
                    ELSE 'ACTIVE'
                END AS status
            FROM patient_insurance pi
            LEFT JOIN insurance_plan ip ON pi.plan_id = ip.plan_id
            LEFT JOIN insurance_payer ipy ON ip.payer_id = ipy.payer_id
            WHERE pi.patient_id = ?
              AND pi.is_primary = 1
            ORDER BY pi.effective_date DESC
            LIMIT 1";

    $result = executeQuery($conn, $sql, 'i', [$patient_id]);

    closeDBConnection($conn);

    if (empty($result)) {
        echo json_encode([
            'success' => true,
            'has_insurance' => false,
            'insurance' => null
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'has_insurance' => true,
        'insurance' => $result[0]
    ]);

} catch (Exception $e) {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
