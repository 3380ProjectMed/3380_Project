<?php
/**
 * Save treatments for a patient visit
 * Appends new treatments without deleting existing ones
 * Prevents duplicate treatment entries
 */
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

header('Content-Type: application/json');

try {
    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    $user_id = (int)$_SESSION['uid'];
    
    // Verify user is a doctor
    $conn = getDBConnection();
    $rows = executeQuery($conn, '
        SELECT s.staff_id 
        FROM staff s
        JOIN user_account ua ON ua.email = s.staff_email
        WHERE ua.user_id = ?', 'i', [$user_id]);
    
    if (empty($rows)) {
        closeDBConnection($conn);
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied - doctors only']);
        exit;
    }
    
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    $visit_id = isset($input['visit_id']) ? intval($input['visit_id']) : 0;
    $treatments = isset($input['treatments']) ? $input['treatments'] : [];
    
    if ($visit_id === 0) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'visit_id required']);
        exit;
    }
    
    if (!is_array($treatments) || empty($treatments)) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'At least one treatment required']);
        exit;
    }
    
    // Verify visit exists
    $visitCheck = executeQuery(
        $conn,
        'SELECT visit_id FROM patient_visit WHERE visit_id = ?',
        'i',
        [$visit_id]
    );
    
    if (empty($visitCheck)) {
        closeDBConnection($conn);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Visit not found']);
        exit;
    }
    
    // Begin transaction
    $conn->begin_transaction();
    
    try {
        // Insert new treatments (append mode - don't delete existing)
        $insertSql = "INSERT INTO treatment_per_visit 
                      (visit_id, treatment_id, quantity, cost_each, notes) 
                      VALUES (?, ?, ?, ?, ?)";
        
        $added_count = 0;
        $skipped_count = 0;
        
        foreach ($treatments as $treatment) {
            $treatment_id = intval($treatment['treatment_id'] ?? 0);
            $quantity = intval($treatment['quantity'] ?? 1);
            $cost_each = floatval($treatment['cost_each'] ?? 0);
            $notes = trim($treatment['notes'] ?? '');
            
            if ($treatment_id > 0) {
                // Check if this exact treatment already exists for this visit
                $checkSql = "SELECT visit_treatment_id FROM treatment_per_visit 
                            WHERE visit_id = ? AND treatment_id = ? 
                            LIMIT 1";
                $existing = executeQuery($conn, $checkSql, 'ii', [$visit_id, $treatment_id]);
                
                if (empty($existing)) {
                    // Only insert if it doesn't already exist
                    executeQuery($conn, $insertSql, 'iiids', [
                        $visit_id,
                        $treatment_id,
                        $quantity,
                        $cost_each,
                        $notes
                    ]);
                    $added_count++;
                } else {
                    $skipped_count++;
                }
            }
        }
        
        $conn->commit();
        closeDBConnection($conn);
        
        $message = "Treatments saved successfully";
        if ($added_count > 0 && $skipped_count > 0) {
            $message = "$added_count treatment(s) added, $skipped_count already existed";
        } elseif ($skipped_count > 0 && $added_count === 0) {
            $message = "All selected treatments already exist for this visit";
        }
        
        echo json_encode([
            'success' => true,
            'message' => $message,
            'added_count' => $added_count,
            'skipped_count' => $skipped_count
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        closeDBConnection($conn);
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>