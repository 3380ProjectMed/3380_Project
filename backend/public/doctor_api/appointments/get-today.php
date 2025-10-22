<?php
/**
 * Get today's appointments for a doctor
 */

// ✅ CORRECT PATHS - Two levels up from api/appointments/
require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../database.php';

try {
    $conn = getDBConnection();
    
    // Get doctor_id from query parameter
    $doctor_id = isset($_GET['doctor_id']) ? intval($_GET['doctor_id']) : 202;
    
    // Get today's date
    $today = date('Y-m-d');
    
    // SQL query
    $sql = "SELECT 
                a.Appointment_id,
                a.Appointment_date,
                a.Reason_for_visit,
                a.Office_id,
                CONCAT(p.First_Name, ' ', p.Last_Name) as patient_name,
                p.Patient_ID as patient_id,
                p.Allergies as allergy_code,
                ca.Allergies_Text as allergies,
                o.Name as office_name
            FROM Appointment a
            INNER JOIN Patient p ON a.Patient_id = p.Patient_ID
            LEFT JOIN CodesAllergies ca ON p.Allergies = ca.AllergiesCode
            LEFT JOIN Office o ON a.Office_id = o.Office_ID
            WHERE a.Doctor_id = ?
            AND DATE(a.Appointment_date) = ?
            ORDER BY a.Appointment_date";
    
    $appointments = executeQuery($conn, $sql, 'is', [$doctor_id, $today]);
    
    // Format response
    $formatted_appointments = [];
    foreach ($appointments as $apt) {
        $formatted_appointments[] = [
            'id' => 'A' . str_pad($apt['Appointment_id'], 4, '0', STR_PAD_LEFT),
            'patientId' => 'P' . str_pad($apt['patient_id'], 3, '0', STR_PAD_LEFT),
            'patientName' => $apt['patient_name'],
            'time' => date('g:i A', strtotime($apt['Appointment_date'])),
            'reason' => $apt['Reason_for_visit'] ?: 'General Visit',
            'status' => 'Scheduled',
            'location' => $apt['office_name'],
            'allergies' => $apt['allergies'] ?: 'No Known Allergies'
        ];
    }
    
    // Calculate stats
    $stats = [
        'total' => count($formatted_appointments),
        'scheduled' => count($formatted_appointments),
        'waiting' => 0,
        'completed' => 0
    ];
    
    closeDBConnection($conn);
    
    echo json_encode([
        'success' => true,
        'appointments' => $formatted_appointments,
        'stats' => $stats,
        'count' => count($formatted_appointments)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>