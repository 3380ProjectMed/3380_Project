<?php
/**
 * ==========================================
 * FILE: public/receptionist_api/patients/add-insurance.php
 * ==========================================
 * Add or update patient insurance information
 * Used when patient has no insurance or expired insurance
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {
    if (empty($_SESSION['uid']) || $_SESSION['role'] !== 'RECEPTIONIST') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Receptionist access required']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    
    $patient_id = isset($input['patient_id']) ? (int) $input['patient_id'] : 0;
    $plan_id = isset($input['plan_id']) ? (int) $input['plan_id'] : 0;
    $member_id = isset($input['member_id']) ? trim($input['member_id']) : '';
    $group_id = isset($input['group_id']) ? trim($input['group_id']) : '';
    $effective_date = isset($input['effective_date']) ? trim($input['effective_date']) : '';
    $expiration_date = isset($input['expiration_date']) ? trim($input['expiration_date']) : null;
    $is_primary = isset($input['is_primary']) ? (int) $input['is_primary'] : 1;

    
    if ($patient_id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid patient ID required']);
        exit;
    }

    if ($plan_id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Insurance plan required']);
        exit;
    }

    if (empty($member_id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Member ID required']);
        exit;
    }

    if (empty($effective_date)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Effective date required']);
        exit;
    }

    
    $effective = date_create($effective_date);
    if (!$effective) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid effective date format']);
        exit;
    }

    if ($expiration_date) {
        $expiration = date_create($expiration_date);
        if (!$expiration) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid expiration date format']);
            exit;
        }
        
        
        if ($expiration <= $effective) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Expiration date must be after effective date']);
            exit;
        }
    }

    $conn = getDBConnection();

    $patientCheck = "SELECT patient_id FROM patient WHERE patient_id = ?";
    $patientResult = executeQuery($conn, $patientCheck, 'i', [$patient_id]);
    
    if (empty($patientResult)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Patient not found']);
        exit;
    }

    $planCheck = "SELECT plan_id, plan_name FROM insurance_plan WHERE plan_id = ?";
    $planResult = executeQuery($conn, $planCheck, 'i', [$plan_id]);
    
    if (empty($planResult)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Insurance plan not found']);
        exit;
    }

    $existingInsuranceCheck = "SELECT id, expiration_date 
                               FROM patient_insurance 
                               WHERE patient_id = ? 
                               AND is_primary = 1 
                               AND (expiration_date IS NULL OR expiration_date < CURDATE() OR expiration_date IS NOT NULL)
                               ORDER BY effective_date DESC 
                               LIMIT 1";
    $existingInsurance = executeQuery($conn, $existingInsuranceCheck, 'i', [$patient_id]);

    $insurance_id = null;
    $action = 'added';

    if (!empty($existingInsurance)) {
        $existing_id = $existingInsurance[0]['id'];
        $existing_expiration = $existingInsurance[0]['expiration_date'];
        
        
        $should_update = false;
        if ($existing_expiration === null) {
            $should_update = true; // We'll replace it
        } else {
            $exp_date = date_create($existing_expiration);
            $today = new DateTime();
            if ($exp_date < $today) {
                
                $should_update = true;
            }
        }

        if ($should_update) {
            
            $updateSql = "UPDATE patient_insurance 
                         SET plan_id = ?, 
                             member_id = ?, 
                             group_id = ?, 
                             effective_date = ?, 
                             expiration_date = ?, 
                             is_primary = ?
                         WHERE id = ?";
            
            $updateParams = [
                $plan_id,
                $member_id,
                $group_id,
                $effective_date,
                $expiration_date,
                $is_primary,
                $existing_id
            ];
            
            executeQuery($conn, $updateSql, 'issssii', $updateParams);
            $insurance_id = $existing_id;
            $action = 'updated';
        } else {
            
            if ($is_primary) {
                $unsetPrimary = "UPDATE patient_insurance SET is_primary = 0 WHERE patient_id = ? AND is_primary = 1";
                executeQuery($conn, $unsetPrimary, 'i', [$patient_id]);
            }
            
            
            $insertSql = "INSERT INTO patient_insurance (patient_id, plan_id, member_id, group_id, effective_date, expiration_date, is_primary)
                         VALUES (?, ?, ?, ?, ?, ?, ?)";
            
            $insertParams = [
                $patient_id,
                $plan_id,
                $member_id,
                $group_id,
                $effective_date,
                $expiration_date,
                $is_primary
            ];
            
            executeQuery($conn, $insertSql, 'iissssi', $insertParams);
            $insurance_id = $conn->insert_id;
        }
    } else {
        
        $insertSql = "INSERT INTO patient_insurance (patient_id, plan_id, member_id, group_id, effective_date, expiration_date, is_primary)
                     VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        $insertParams = [
            $patient_id,
            $plan_id,
            $member_id,
            $group_id,
            $effective_date,
            $expiration_date,
            $is_primary
        ];
        
        executeQuery($conn, $insertSql, 'iissssi', $insertParams);
        $insurance_id = $conn->insert_id;
    }

    
    if ($is_primary && $insurance_id) {
        $updatePatient = "UPDATE patient SET insurance_id = ? WHERE patient_id = ?";
        executeQuery($conn, $updatePatient, 'ii', [$insurance_id, $patient_id]);
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'message' => 'Insurance ' . $action . ' successfully',
        'insurance_id' => $insurance_id,
        'plan_name' => $planResult[0]['plan_name'],
        'action' => $action
    ]);

} catch (Exception $e) {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
