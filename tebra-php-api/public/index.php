<?php
// Load the WORKING TebraHttpClient
require_once __DIR__ . '/../src/TebraHttpClient.php';

// Enable CORS for Firebase app
header('Access-Control-Allow-Origin: *'); // Restrict in production
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Health check endpoint
if ($_SERVER['REQUEST_URI'] === '/health') {
    echo json_encode(['status' => 'healthy', 'service' => 'tebra-php-api']);
    exit;
}

// Simple API key check
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
$expectedKey = getenv('INTERNAL_API_KEY') ?: 'development-key';

if ($apiKey !== $expectedKey) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Main API logic
try {
    // Get credentials from environment (Cloud Run will provide these)
    $config = [
        'wsdlUrl' => getenv('TEBRA_WSDL_URL'),
        'username' => getenv('TEBRA_USERNAME'),
        'password' => getenv('TEBRA_PASSWORD'),
        'customerKey' => getenv('TEBRA_CUSTOMER_KEY')
    ];
    
    // Initialize the WORKING client
    $client = new TebraHttpClient($config);
    
    // Parse request
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['action'])) {
        throw new Exception('Invalid request format');
    }
    
    // Route to appropriate method
    switch ($input['action']) {
        case 'getProviders':
            $result = $client->callSoapMethod('GetProviders', 
                $client->buildProvidersRequest($input['params'] ?? []));
            break;
            
        case 'getAppointments':
            $result = $client->callSoapMethod('GetAppointments',
                $client->buildAppointmentsRequest($input['params'] ?? []));
            break;
            
        default:
            throw new Exception('Unknown action: ' . $input['action']);
    }
    
    echo json_encode([
        'success' => true,
        'data' => $result
    ]);
    
} catch (Exception $e) {
    error_log('Tebra API Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} 