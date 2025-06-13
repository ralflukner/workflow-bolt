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
$rawBody = file_get_contents('php://input');
$requestBody = json_decode($rawBody, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON: ' . json_last_error_msg()]);
    exit;
}

$action = $requestBody['action'] ?? '';
$params = $requestBody['params'] ?? [];

try {
    // Validate required environment variables
    $requiredEnvVars = [
        'TEBRA_USERNAME' => 'Tebra username',
        'TEBRA_PASSWORD' => 'Tebra password',
        'TEBRA_CUSTOMER_KEY' => 'Tebra customer key',
        'TEBRA_WSDL_URL' => 'Tebra WSDL URL'
    ];

    $missingVars = [];
    foreach ($requiredEnvVars as $var => $description) {
        $value = getenv($var);
        if ($value === false || $value === '') {
            $missingVars[] = $description;
        }
    }

    if (!empty($missingVars)) {
        http_response_code(503);
        echo json_encode([
            'error' => 'Service temporarily unavailable',
            'details' => 'Configuration error: Missing required environment variables'
        ]);
        exit;
    }

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
error_log($e);                   // server-side
echo json_encode(['error' => 'Internal server error']);
} 