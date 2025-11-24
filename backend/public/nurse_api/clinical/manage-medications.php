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
        "SELECT n.nurse_id, n.staff_id FROM nurse n JOIN staff s ON n.staff_id = s.staff_id WHERE s.staff_email = ? LIMIT 1",
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
    $staff_id = (int)$nurseRows[0]['staff_id'];

    if ($method === 'POST') {
        // Add medication to history or create prescription
        $input = json_decode(file_get_contents('php://input'), true);
        $patient_id = $input['patient_id'] ?? 0;
        $medication_name = trim($input['medication_name'] ?? '');
        $dosage = trim($input['dosage'] ?? '');
        $frequency = trim($input['frequency'] ?? '');
        $route = trim($input['route'] ?? 'Oral');
        $notes = trim($input['notes'] ?? '');
        $type = $input['type'] ?? 'history'; // 'history' or 'prescription'

        if (!$patient_id || !$medication_name) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'patient_id and medication_name are required']);
            exit;
        }

        if ($type === 'prescription') {
            // Add to prescription table (if exists)
            try {
                $start_date = $input['start_date'] ?? date('Y-m-d');
                $end_date = $input['end_date'] ?? null;
                $refills_allowed = $input['refills_allowed'] ?? 0;
                
                $doctor_id = null;
                if ($patient_id) {
                    $doctor_query = "SELECT doctor_id FROM patient_visit WHERE patient_id = ? AND (status = 'Scheduled' OR status = 'In Progress' OR status = 'Ready') ORDER BY date DESC LIMIT 1";
                    $doctor_rows = executeQuery($conn, $doctor_query, 'i', [$patient_id]);
                    if (!empty($doctor_rows)) {
                        $doctor_id = $doctor_rows[0]['doctor_id'];
                    }
                }
                
                // If no doctor found from visit, use the nurse's staff_id (nurse acting as prescriber)
                $prescriber_id = $doctor_id ?? $staff_id;

                $insert_prescription_sql = "INSERT INTO prescription 
                    (patient_id, medication_name, dosage, frequency, route, start_date, end_date, notes, refills_allowed, doctor_id) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                
                executeQuery($conn, $insert_prescription_sql, 'isssssssii', [
                    $patient_id, $medication_name, $dosage, $frequency, $route, 
                    $start_date, $end_date, $notes, $refills_allowed, $prescriber_id
                ]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Prescription added successfully',
                    'prescription_id' => mysqli_insert_id($conn)
                ]);
            } catch (Exception $e) {
                error_log("Prescription insertion failed: " . $e->getMessage());
                
                // Fall back to medication history with date information
                $duration_frequency = $dosage && $frequency ? "$dosage - $frequency" : ($frequency ?: 'As directed');
                
                // Add date information if available
                if ($start_date) {
                    $date_info = "Started: " . date('M Y', strtotime($start_date));
                    if ($end_date) {
                        $date_info .= " | Stopped: " . date('M Y', strtotime($end_date));
                    }
                    $duration_frequency .= " (" . $date_info . ")";
                }
                
                $insert_history_sql = "INSERT INTO medication_history (patient_id, drug_name, duration_and_frequency_of_drug_use) VALUES (?, ?, ?)";
                executeQuery($conn, $insert_history_sql, 'iss', [$patient_id, $medication_name, $duration_frequency]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Prescription failed, added to history instead. Error: ' . $e->getMessage(),
                    'drug_id' => mysqli_insert_id($conn),
                    'fallback' => true
                ]);
            }
        } else {
            // Add to medication history
            try {
                $start_date = $input['start_date'] ?? null;
                $end_date = $input['end_date'] ?? null;
                
                // Build duration_frequency with date information
                $duration_frequency = '';
                if ($dosage && $frequency) {
                    $duration_frequency = "$dosage - $frequency";
                } else if ($frequency) {
                    $duration_frequency = $frequency;
                } else {
                    $duration_frequency = 'As directed';
                }
                
                // Add date information to the duration field if available
                if ($start_date) {
                    $date_info = "Started: " . date('M Y', strtotime($start_date));
                    if ($end_date) {
                        $date_info .= " | Stopped: " . date('M Y', strtotime($end_date));
                    }
                    $duration_frequency .= " (" . $date_info . ")";
                }
                
                $insert_history_sql = "INSERT INTO medication_history (patient_id, drug_name, duration_and_frequency_of_drug_use) VALUES (?, ?, ?)";
                executeQuery($conn, $insert_history_sql, 'iss', [$patient_id, $medication_name, $duration_frequency]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Medication added to history',
                    'drug_id' => mysqli_insert_id($conn)
                ]);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => 'Failed to add medication: ' . $e->getMessage()]);
            }
        }

    } elseif ($method === 'PUT') {
        // Update existing medication
        $input = json_decode(file_get_contents('php://input'), true);
        $prescription_id = $input['prescription_id'] ?? 0;
        $drug_id = $input['drug_id'] ?? 0;
        $type = $input['type'] ?? 'prescription';

        if ($type === 'prescription' && $prescription_id) {
            try {
                $update_fields = [];
                $params = [];
                $types = '';

                if (isset($input['medication_name'])) {
                    $update_fields[] = "medication_name = ?";
                    $params[] = trim($input['medication_name']);
                    $types .= 's';
                }
                if (isset($input['dosage'])) {
                    $update_fields[] = "dosage = ?";
                    $params[] = trim($input['dosage']);
                    $types .= 's';
                }
                if (isset($input['frequency'])) {
                    $update_fields[] = "frequency = ?";
                    $params[] = trim($input['frequency']);
                    $types .= 's';
                }
                if (isset($input['notes'])) {
                    $update_fields[] = "notes = ?";
                    $params[] = trim($input['notes']);
                    $types .= 's';
                }

                if (!empty($update_fields)) {
                    $params[] = $prescription_id;
                    $types .= 'i';

                    $update_sql = "UPDATE prescription SET " . implode(', ', $update_fields) . " WHERE prescription_id = ?";
                    executeQuery($conn, $update_sql, $types, $params);
                }

                echo json_encode(['success' => true, 'message' => 'Prescription updated successfully']);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => 'Failed to update prescription: ' . $e->getMessage()]);
            }
        } elseif ($type === 'history' && $drug_id) {
            try {
                $medication_name = trim($input['medication_name'] ?? '');
                $dosage = trim($input['dosage'] ?? '');
                $frequency = trim($input['frequency'] ?? '');
                $duration_frequency = $dosage && $frequency ? "$dosage - $frequency" : ($frequency ?: 'As directed');

                $update_sql = "UPDATE medication_history SET drug_name = ?, duration_and_frequency_of_drug_use = ? WHERE drug_id = ?";
                executeQuery($conn, $update_sql, 'ssi', [$medication_name, $duration_frequency, $drug_id]);

                echo json_encode(['success' => true, 'message' => 'Medication history updated successfully']);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => 'Failed to update medication history: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid update parameters']);
        }

    } elseif ($method === 'DELETE') {
        // Remove medication
        $prescription_id = $_GET['prescription_id'] ?? 0;
        $drug_id = $_GET['drug_id'] ?? 0;
        $type = $_GET['type'] ?? 'prescription';

        if ($type === 'prescription' && $prescription_id) {
            try {
                $delete_sql = "DELETE FROM prescription WHERE prescription_id = ?";
                executeQuery($conn, $delete_sql, 'i', [$prescription_id]);
                echo json_encode(['success' => true, 'message' => 'Prescription removed successfully']);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => 'Failed to remove prescription: ' . $e->getMessage()]);
            }
        } elseif ($type === 'history' && $drug_id) {
            try {
                $delete_sql = "DELETE FROM medication_history WHERE drug_id = ?";
                executeQuery($conn, $delete_sql, 'i', [$drug_id]);
                echo json_encode(['success' => true, 'message' => 'Medication history removed successfully']);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => 'Failed to remove medication history: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'prescription_id or drug_id is required']);
        }

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