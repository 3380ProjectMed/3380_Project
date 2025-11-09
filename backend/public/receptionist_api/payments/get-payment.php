<?php
/**
 * SIMPLE VERSION - Get visit for payment
 * Just shows what patient owes
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';

header('Content-Type: application/json');

try {
    session_start();
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

    $visit_id = (int) $_GET['visit_id'];
    $conn = getDBConnection();

    // Get visit with patient and insurance info
    $sql = "SELECT 
                pv.visit_id,
                pv.patient_id,
                pv.appointment_id,
                pv.date as visit_date,
                pv.payment,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                p.dob,
                p.emergency_contact,
                CONCAT(sf.first_name, ' ', sf.last_name) as doctor_name,
                -- Get copay from insurance if patient has it
                iplan.copay as insurance_copay
            FROM patient_visit pv
            INNER JOIN patient p ON pv.patient_id = p.patient_id
            LEFT JOIN doctor d ON p.doctor_id = d.doctor_id
            LEFT JOIN staff sf ON d.staff_id = sf.staff_id
            LEFT JOIN patient_insurance pi ON pi.patient_id = p.patient_id AND pi.is_primary = 1
            LEFT JOIN insurance_plan iplan ON pi.plan_id = iplan.plan_id
            WHERE pv.visit_id = ?";

    $visits = executeQuery($conn, $sql, 'i', [$visit_id]);

    if (empty($visits)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Visit not found']);
        exit;
    }

    $visit = $visits[0];

    // Get treatments for this visit
    $treatmentSql = "SELECT 
                        tc.name as treatment_name,
                        tpv.quantity,
                        tpv.cost_each,
                        tpv.total_cost
                    FROM treatment_per_visit tpv
                    LEFT JOIN treatment_catalog tc ON tpv.treatment_id = tc.treatment_id
                    WHERE tpv.visit_id = ?";

    $treatments = executeQuery($conn, $treatmentSql, 'i', [$visit_id]);

    // Calculate totals
    $treatment_total = 0;
    $treatment_list = [];

    if (is_array($treatments)) {
        foreach ($treatments as $t) {
            $treatment_total += (float) $t['total_cost'];
            $treatment_list[] = [
                'name' => $t['treatment_name'],
                'quantity' => (int) $t['quantity'],
                'cost' => number_format((float) $t['total_cost'], 2)
            ];
        }
    }

    // Simple calculation
    $copay = (float) ($visit['insurance_copay'] ?? 0);
    $total_due = $copay + $treatment_total;
    $already_paid = (float) ($visit['payment'] ?? 0);
    $remaining = $total_due - $already_paid;

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'visit' => [
            'visit_id' => $visit['visit_id'],
            'patient_id' => $visit['patient_id'],
            'patient_name' => $visit['patient_name'],
            'patient_dob' => $visit['dob'],
            'patient_phone' => $visit['emergency_contact'],
            'appointment_id' => $visit['appointment_id'],
            'visit_date' => $visit['visit_date'],
            'doctor_name' => $visit['doctor_name']
        ],
        'payment_info' => [
            'copay' => number_format($copay, 2),
            'treatments' => number_format($treatment_total, 2),
            'total_due' => number_format($total_due, 2),
            'already_paid' => number_format($already_paid, 2),
            'remaining' => number_format($remaining, 2),
            'needs_payment' => $remaining > 0
        ],
        'treatments' => $treatment_list
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>