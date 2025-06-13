<?php

require_once __DIR__ . '/TebraApiClient.php';
require_once __DIR__ . '/config.php';

// Set headers for JSON response
header('Content-Type: application/json');

// Verify API key
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if ($apiKey !== getenv('INTERNAL_API_KEY')) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid API key']);
    exit;
}

// Get request body
$requestBody = json_decode(file_get_contents('php://input'), true);
if (!$requestBody) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request body']);
    exit;
}

$action = $requestBody['action'] ?? '';
$params = $requestBody['params'] ?? [];

try {
    $client = new TebraApiClient(
        getenv('TEBRA_USERNAME'),
        getenv('TEBRA_PASSWORD'),
        getenv('TEBRA_CUSTOMER_KEY'),
        getenv('TEBRA_WSDL_URL')
    );

    $result = null;
    switch ($action) {
        case 'getAppointments':
            $fromDate = new DateTime($params['fromDate']);
            $toDate = new DateTime($params['toDate']);
            $result = $client->getAppointments($fromDate, $toDate);
            break;

        case 'getPatients':
            $patientIds = $params['patientIds'] ?? [];
            $result = $client->getPatients($patientIds);
            break;

        case 'getProviders':
            $result = $client->getProviders();
            break;

        default:
            throw new Exception("Unknown action: $action");
    }

    echo json_encode($result);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} 