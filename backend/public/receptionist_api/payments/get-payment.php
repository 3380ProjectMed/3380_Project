<?php
header('Content-Type: application/json');
/**
 * Get copay info for visit
 * Receptionists collect copays - show insurance copay amount
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

    if (!isset($_GET['visit_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'visit_id required']);
        exit;
    }

    $visit_id = (int)$_GET['visit_id'];
    $conn = getDBConnection();

    // Get visit with patient info
    $sql = "SELECT 
                pv.visit_id,
                pv.patient_id,
                pv.appointment_id,
                a.Appointment_date as visit_date,
                pv.payment,
                pv.payment_method,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                p.dob,
                p.email,
                ec.ec_phone as patient_phone
            FROM patient_visit pv
            INNER JOIN patient p ON pv.patient_id = p.patient_id
            INNER JOIN appointment a ON pv.appointment_id = a.Appointment_id
            LEFT JOIN emergency_contact ec ON p.emergency_contact_id = ec.emergency_contact_id
            WHERE pv.visit_id = ?";

    $visits = executeQuery($conn, $sql, 'i', [$visit_id]);

    if (empty($visits)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Visit not found']);
        exit;
    }

    $visit = $visits[0];

    // Get patient's PRIMARY insurance copay
    $insuranceSql = "SELECT 
                        pi.id as insurance_id,
                        pi.member_id,
                        pi.group_id,
                        iplan.plan_name,
                        iplan.plan_type,
                        iplan.copay,
                        iplan.deductible_individual,
                        iplan.coinsurance_rate,
                        ipayer.name as payer_name
                    FROM patient_insurance pi
                    INNER JOIN insurance_plan iplan ON pi.plan_id = iplan.plan_id
                    INNER JOIN insurance_payer ipayer ON iplan.payer_id = ipayer.payer_id
                    WHERE pi.patient_id = ? 
                    AND pi.is_primary = 1
                    AND (pi.expiration_date IS NULL OR pi.expiration_date >= CURDATE())
                    AND pi.effective_date <= CURDATE()
                    LIMIT 1";

    $insuranceRows = executeQuery($conn, $insuranceSql, 'i', [$visit['patient_id']]);

    $insurance_info = null;
    $copay_amount = 0;

    if (!empty($insuranceRows)) {
        $ins = $insuranceRows[0];
        $copay_amount = (float)($ins['copay'] ?? 0);

        $insurance_info = [
            'has_insurance' => true,
            'payer_name' => $ins['payer_name'],
            'plan_name' => $ins['plan_name'],
            'plan_type' => $ins['plan_type'],
            'member_id' => $ins['member_id'],
            'group_id' => $ins['group_id'],
            'copay' => number_format($copay_amount, 2),
            'deductible' => $ins['deductible_individual'] ? number_format((float)$ins['deductible_individual'], 2) : 'N/A',
            'coinsurance_rate' => $ins['coinsurance_rate'] ? $ins['coinsurance_rate'] . '%' : 'N/A'
        ];
    } else {
        $insurance_info = [
            'has_insurance' => false,
            'message' => 'No active insurance on file'
        ];
    }

    $already_paid = (float)($visit['payment'] ?? 0);

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'visit' => [
            'visit_id' => $visit['visit_id'],
            'patient_id' => $visit['patient_id'],
            'patient_name' => $visit['patient_name'],
            'patient_dob' => $visit['dob'],
            'patient_phone' => $visit['patient_phone'],
            'patient_email' => $visit['email'],
            'appointment_id' => $visit['appointment_id'],
            'visit_date' => $visit['visit_date'],
            'already_paid' => number_format($already_paid, 2),
            'payment_method_used' => $visit['payment_method']
        ],
        'insurance' => $insurance_info,
        'copay_amount' => number_format($copay_amount, 2),
        'needs_payment' => $already_paid == 0
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
