<?php
header('Content-Type: application/json');
require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

if (empty($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'UNAUTHENTICATED']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    $conn = getDBConnection();
    $email = $_SESSION['email'] ?? '';

    // Verify nurse authentication
    $nurseRows = executeQuery(
        $conn,
        "SELECT n.nurse_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1",
        's',
        [$email]
    );

    if (empty($nurseRows)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Nurse not found']);
        closeDBConnection($conn);
        exit;
    }

    $nurse_id = (int)$nurseRows[0]['nurse_id'];

    if ($method === 'POST') {
        // Add or update allergy
        $input = json_decode(file_get_contents('php://input'), true);
        $patient_id = $input['patient_id'] ?? 0;
        $allergy_text = trim($input['allergy_text'] ?? '');
        $notes = trim($input['notes'] ?? '');

        if (!$patient_id || !$allergy_text) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'patient_id and allergy_text are required']);
            exit;
        }

        // First, check if allergy exists in codes_allergies table
        $allergy_code = null;
        $allergy_rows = executeQuery(
            $conn,
            "SELECT allergies_code FROM codes_allergies WHERE allergies_text = ? LIMIT 1",
            's',
            [$allergy_text]
        );

        if (!empty($allergy_rows)) {
            $allergy_code = $allergy_rows[0]['allergies_code'];
        } else {
            // Create new allergy code
            $insert_sql = "INSERT INTO codes_allergies (allergies_text) VALUES (?)";
            executeQuery($conn, $insert_sql, 's', [$allergy_text]);
            $allergy_code = mysqli_insert_id($conn);
        }

        // Try to insert into allergies_per_patient table (if it exists)
        try {
            $insert_allergy_sql = "INSERT INTO allergies_per_patient (patient_id, allergies_code, notes) 
                                 VALUES (?, ?, ?) 
                                 ON DUPLICATE KEY UPDATE notes = VALUES(notes), updated_at = CURRENT_TIMESTAMP";
            executeQuery($conn, $insert_allergy_sql, 'iis', [$patient_id, $allergy_code, $notes]);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Allergy added/updated successfully',
                'allergy_code' => $allergy_code
            ]);
        } catch (Exception $e) {
            // If allergies_per_patient doesn't exist, fall back to updating patient table
            $update_patient_sql = "UPDATE patient SET allergies = ? WHERE patient_id = ?";
            executeQuery($conn, $update_patient_sql, 'ii', [$allergy_code, $patient_id]);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Allergy updated in patient record',
                'allergy_code' => $allergy_code,
                'note' => 'Using fallback patient.allergies field'
            ]);
        }

    } elseif ($method === 'DELETE') {
        // Remove allergy
        $patient_id = $_GET['patient_id'] ?? 0;
        $allergy_id = $_GET['allergy_id'] ?? 0;
        $allergy_code = $_GET['allergy_code'] ?? 0;

        if (!$patient_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'patient_id is required']);
            exit;
        }

        if ($allergy_id) {
            // Remove from allergies_per_patient table
            try {
                $delete_sql = "DELETE FROM allergies_per_patient WHERE app_id = ? AND patient_id = ?";
                executeQuery($conn, $delete_sql, 'ii', [$allergy_id, $patient_id]);
                echo json_encode(['success' => true, 'message' => 'Allergy removed successfully']);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => 'Failed to remove allergy: ' . $e->getMessage()]);
            }
        } elseif ($allergy_code) {
            // Remove from patient table
            $update_sql = "UPDATE patient SET allergies = NULL WHERE patient_id = ? AND allergies = ?";
            executeQuery($conn, $update_sql, 'ii', [$patient_id, $allergy_code]);
            echo json_encode(['success' => true, 'message' => 'Allergy removed from patient record']);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'allergy_id or allergy_code is required']);
        }

    } elseif ($method === 'GET') {
        // Get all available allergy codes for dropdown
        $allergy_codes_sql = "SELECT allergies_code, allergies_text FROM codes_allergies ORDER BY allergies_text";
        $allergy_codes = executeQuery($conn, $allergy_codes_sql);
        
        echo json_encode([
            'success' => true,
            'allergy_codes' => $allergy_codes ?: []
        ]);

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

    closeDBConnection($conn);

} catch (Exception $e) {
    if (isset($conn)) closeDBConnection($conn);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>