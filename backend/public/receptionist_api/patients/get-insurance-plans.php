<?php

require_once '/home/site/wwwroot/cors.php';
require_once '/home/site/wwwroot/database.php';
require_once '/home/site/wwwroot/session.php';

try {

    if (empty($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    $conn = getDBConnection();

    $sql = "SELECT
                ip.plan_id,
                ip.plan_name,
                ip.plan_type,
                ip.copay,
                ip.deductible_individual,
                ip.coinsurance_rate,
                ipy.payer_id,
                ipy.name as payer_name,
                ipy.payer_type
            FROM insurance_plan ip
            JOIN insurance_payer ipy ON ip.payer_id = ipy.payer_id
            ORDER BY ipy.name, ip.plan_name";

    $plans = executeQuery($conn, $sql, '', []);

    $grouped_plans = [];
    foreach ($plans as $plan) {
        $payer_id = $plan['payer_id'];
        if (!isset($grouped_plans[$payer_id])) {
            $grouped_plans[$payer_id] = [
                'payer_id' => $plan['payer_id'],
                'payer_name' => $plan['payer_name'],
                'payer_type' => $plan['payer_type'],
                'plans' => []
            ];
        }

        $grouped_plans[$payer_id]['plans'][] = [
            'plan_id' => $plan['plan_id'],
            'plan_name' => $plan['plan_name'],
            'plan_type' => $plan['plan_type'],
            'copay' => $plan['copay'],
            'deductible_individual' => $plan['deductible_individual'],
            'coinsurance_rate' => $plan['coinsurance_rate']
        ];
    }

    closeDBConnection($conn);

    echo json_encode([
        'success' => true,
        'plans' => array_values($grouped_plans)
    ]);

} catch (Exception $e) {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}