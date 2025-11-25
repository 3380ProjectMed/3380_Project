<?php
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
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $visit_id = isset($input['visit_id']) ? intval($input['visit_id']) : 0;
    $treatments = isset($input['treatments']) ? $input['treatments'] : [];
    
    if ($visit_id === 0) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'visit_id required']);
        exit;
    }
    
    if (!is_array($treatments)) {
        closeDBConnection($conn);
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'treatments must be an array']);
        exit;
    }

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
    
    $conn->begin_transaction();
    
    try {
        $deleteSql = "DELETE FROM treatment_per_visit WHERE visit_id = ?";
        executeQuery($conn, $deleteSql, 'i', [$visit_id]);
        
        $inserted_count = 0;
        
        if (!empty($treatments)) {
            $insertSql = "INSERT INTO treatment_per_visit 
                          (visit_id, treatment_id, quantity, cost_each, notes) 
                          VALUES (?, ?, ?, ?, ?)";
            
            foreach ($treatments as $treatment) {
                $treatment_id = intval($treatment['treatment_id'] ?? 0);
                $quantity = intval($treatment['quantity'] ?? 1);
                $cost_each = floatval($treatment['cost_each'] ?? 0);
                $notes = trim($treatment['notes'] ?? '');
                
                if ($treatment_id > 0) {
                    executeQuery($conn, $insertSql, 'iiids', [
                        $visit_id,
                        $treatment_id,
                        $quantity,
                        $cost_each,
                        $notes
                    ]);
                    $inserted_count++;
                }
            }
        }
        
        $conn->commit();
        closeDBConnection($conn);
        
        $message = "Treatments saved successfully";
        if ($inserted_count === 0) {
            $message = "All treatments removed";
        } elseif ($inserted_count === 1) {
            $message = "1 treatment saved";
        } else {
            $message = "$inserted_count treatments saved";
        }
        
        echo json_encode([
            'success' => true,
            'message' => $message,
            'count' => $inserted_count
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