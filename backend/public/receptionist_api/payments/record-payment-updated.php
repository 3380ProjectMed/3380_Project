<?php
header('Content-Type: application/json');
/**
 * Record copay payment with notes support
 * Enhanced version with better validation and tracking
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

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'POST only']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['visit_id']) || !isset($input['amount'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'visit_id and amount required']);
        exit;
    }

    $visit_id = (int)$input['visit_id'];
    $amount = (float)$input['amount'];
    $method = isset($input['method']) ? $input['method'] : 'card';
    $notes = isset($input['notes']) ? trim($input['notes']) : null;

    // Validate payment method
    $valid_methods = ['cash', 'card', 'check'];
    if (!in_array($method, $valid_methods)) {
        $method = 'card';
    }

    if ($amount <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Amount must be greater than 0']);
        exit;
    }

    $conn = getDBConnection();

    // Get receptionist info
    $staffRows = executeQuery($conn, '
        SELECT ws.office_id, CONCAT(s.first_name, " ", s.last_name) as staff_name
        FROM staff s
        JOIN user_account ua ON ua.email = s.staff_email
        JOIN work_schedule ws ON ws.staff_id = s.staff_id
        WHERE ua.user_id = ?
        LIMIT 1', 'i', [(int)$_SESSION['uid']]);

    if (empty($staffRows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No receptionist account found']);
        exit;
    }

    $receptionist_name = $staffRows[0]['staff_name'];
    $office_id = (int)$staffRows[0]['office_id'];

    // Check visit exists and belongs to this office
    $checkSql = "SELECT payment, office_id, patient_id, appointment_id, date as visit_date 
                 FROM patient_visit WHERE visit_id = ?";
    $existing = executeQuery($conn, $checkSql, 'i', [$visit_id]);

    if (empty($existing)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Visit not found']);
        exit;
    }

    if ((int)$existing[0]['office_id'] !== $office_id) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied to this visit']);
        exit;
    }

    if ($existing[0]['payment'] && (float)$existing[0]['payment'] > 0) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Payment already recorded',
            'existing_payment' => number_format((float)$existing[0]['payment'], 2)
        ]);
        exit;
    }

    $patient_id = $existing[0]['patient_id'];
    $appointment_id = $existing[0]['appointment_id'];
    $visit_date = $existing[0]['visit_date'];

    // Update patient_visit with payment
    $updateSql = "UPDATE patient_visit 
                  SET payment = ?,
                      payment_method = ?,
                      copay_amount_due = ?,
                      last_updated = NOW(),
                      updated_by = ?
                  WHERE visit_id = ?";

    executeQuery($conn, $updateSql, 'dsdsi', [$amount, $method, $amount, $receptionist_name, $visit_id]);

    // If notes provided, insert into a payment_notes table (you'll need to create this)
    // For now, we'll just return it in the response
    // TODO: Create payment_notes table if you want to persist notes long-term

    // Get patient name for response
    $patientSql = "SELECT 
                       CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                       p.dob,
                       p.email,
                       ec.ec_phone as patient_phone
                   FROM patient p
                   LEFT JOIN emergency_contact ec ON p.emergency_contact_id = ec.emergency_contact_id
                   WHERE p.patient_id = ?";
    $patientRows = executeQuery($conn, $patientSql, 'i', [$patient_id]);

    $patient_name = $patientRows[0]['patient_name'] ?? 'Unknown';
    $patient_dob = $patientRows[0]['dob'] ?? null;
    $patient_email = $patientRows[0]['email'] ?? null;
    $patient_phone = $patientRows[0]['patient_phone'] ?? null;

    // Get insurance info if available
    $insuranceSql = "SELECT 
                        ipayer.name as payer_name,
                        iplan.plan_name,
                        pi.member_id
                    FROM patient_insurance pi
                    INNER JOIN insurance_plan iplan ON pi.plan_id = iplan.plan_id
                    INNER JOIN insurance_payer ipayer ON iplan.payer_id = ipayer.payer_id
                    WHERE pi.patient_id = ? 
                    AND pi.is_primary = 1
                    AND (pi.expiration_date IS NULL OR pi.expiration_date >= CURDATE())
                    LIMIT 1";

    $insuranceRows = executeQuery($conn, $insuranceSql, 'i', [$patient_id]);

    $insurance_info = null;
    if (!empty($insuranceRows)) {
        $insurance_info = [
            'payer_name' => $insuranceRows[0]['payer_name'],
            'plan_name' => $insuranceRows[0]['plan_name'],
            'member_id' => $insuranceRows[0]['member_id']
        ];
    }

    closeDBConnection($conn);

    // Build comprehensive response for receipt
    echo json_encode([
        'success' => true,
        'message' => 'Copay payment recorded successfully',
        'visit_id' => $visit_id,
        'appointment_id' => $appointment_id,
        'patient_name' => $patient_name,
        'patient_dob' => $patient_dob,
        'patient_email' => $patient_email,
        'patient_phone' => $patient_phone,
        'visit_date' => $visit_date,
        'amount' => number_format($amount, 2),
        'method' => $method,
        'notes' => $notes,
        'recorded_by' => $receptionist_name,
        'recorded_at' => date('Y-m-d H:i:s'),
        'insurance' => $insurance_info,
        'receipt_number' => $visit_id . '-' . time()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
