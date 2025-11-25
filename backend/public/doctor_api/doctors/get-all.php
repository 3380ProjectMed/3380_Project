<?php


require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';
try {
    if (!isset($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $conn = getDBConnection();

    $current_doctor_id = null;
    $user_id = isset($_SESSION['uid']) ? intval($_SESSION['uid']) : null;
    if ($user_id) {
        $currentDoctorRows = executeQuery($conn, 'SELECT d.doctor_id 
                        FROM user_account ua
                        JOIN staff s ON ua.user_id = s.staff_id
                        JOIN doctor d ON s.staff_id = d.staff_id
                        WHERE ua.user_id = ? 
                        LIMIT 1', 'i', [$user_id]);
        if (is_array($currentDoctorRows) && count($currentDoctorRows) > 0) {
            $current_doctor_id = (int)$currentDoctorRows[0]['doctor_id'];
        }
    }

    $sql = "SELECT 
                d.doctor_id,
                st.first_name,
                st.last_name,
                st.staff_email as staff_email,
                d.phone as staff_phone,
                st.license_number,
                s.specialty_name,
                cg.gender_text as gender
            FROM doctor d
            JOIN staff st ON d.staff_id = st.staff_id
            LEFT JOIN specialty s ON d.specialty = s.specialty_id
            LEFT JOIN codes_gender cg ON st.gender = cg.gender_code
            ORDER BY st.last_name, st.first_name";

    $doctors = executeQuery($conn, $sql, '', []);

    $formatted_doctors = [];
    foreach ($doctors as $doc) {
        $doc_id = (int)$doc['doctor_id'];

        if ($current_doctor_id && $doc_id === $current_doctor_id) {
            continue;
        }

        $formatted_doctors[] = [
            'doctor_id' => $doc_id,
            'id' => $doc_id, 
            'firstName' => $doc['first_name'],
            'lastName' => $doc['last_name'],
            'name' => $doc['first_name'] . ' ' . $doc['last_name'], 
            'fullName' => $doc['first_name'] . ' ' . $doc['last_name'],
            'email' => $doc['staff_email'],
            'phone' => $doc['staff_phone'] ?: 'Not provided',
            'licenseNumber' => $doc['license_number'],
            'specialty' => $doc['specialty_name'],
            'specialty_name' => $doc['specialty_name'], 
            'gender' => $doc['gender']
        ];
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'doctors' => $formatted_doctors,
        'count' => count($formatted_doctors)
    ]);
} catch (Exception $e) {
    error_log("Error in doctors/get-all.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
