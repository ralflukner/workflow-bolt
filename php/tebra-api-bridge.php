<?php
/**
 * Tebra API Bridge
 * RESTful API endpoint that bridges HTTP requests to Tebra SOAP API
 */

// List of trusted origins that can access the API
$trustedOrigins = [
    'https://your-production-domain.com',
    'https://staging.your-domain.com',
    'https://localhost:3000',  // For local development
];

// Get the requesting origin
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Check if the origin is trusted
if (in_array($origin, $trustedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400'); // 24 hours
} else {
    // For non-CORS requests or untrusted origins, only allow server-to-server calls
    header('Access-Control-Allow-Origin: null');
}

// Additional security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'TebraApiClient.php';
require_once 'config.php';

// Error handling
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'timestamp' => date('c')
    ]);
    exit;
}

// Success response
function sendSuccess($data, $message = null) {
    echo json_encode([
        'success' => true,
        'data' => $data,
        'message' => $message,
        'timestamp' => date('c')
    ]);
    exit;
}

// Get configuration
try {
    $config = getTebraConfig();
    $client = new TebraApiClient(
        $config['wsdl_url'],
        $config['username'],
        $config['password'],
        $config['customer_key']
    );
} catch (Exception $e) {
    sendError("Configuration error: " . $e->getMessage(), 500);
}

// Route handling
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Remove base path if needed
$path = str_replace('/php/tebra-api-bridge.php', '', $path);
$path = trim($path, '/');

// Parse request data
$input = file_get_contents('php://input');
$data = json_decode($input, true) ?? [];

error_log("Tebra API Bridge - Path: $path, Method: $method");

try {
    switch ($path) {
        case 'ping':
        case 'test-connection':
            $result = $client->testConnection();
            sendSuccess($result);
            break;
            
        case 'appointments':
            if ($method !== 'POST') {
                sendError("Appointments endpoint requires POST method");
            }
            
            $fromDate = $data['fromDate'] ?? null;
            $toDate = $data['toDate'] ?? null;
            
            if (!$fromDate || !$toDate) {
                sendError("Missing required parameters: fromDate, toDate");
            }
            
            $result = $client->getAppointments($fromDate, $toDate);
            sendSuccess($result);
            break;
            
        case 'providers':
            $result = $client->getProviders();
            sendSuccess($result);
            break;
            
        case 'patients/search':
            if ($method !== 'POST') {
                sendError("Patient search endpoint requires POST method");
            }
            
            $lastName = $data['lastName'] ?? null;
            if (!$lastName) {
                sendError("Missing required parameter: lastName");
            }
            
            $result = $client->searchPatients($lastName);
            sendSuccess($result);
            break;
            
        case 'patients':
            if ($method !== 'POST') {
                sendError("Get patient endpoint requires POST method");
            }
            
            $patientId = $data['patientId'] ?? null;
            if (!$patientId) {
                sendError("Missing required parameter: patientId");
            }
            
            $result = $client->getPatientById($patientId);
            sendSuccess($result);
            break;
            
        case 'debug/last-request':
            sendSuccess([
                'request' => $client->getLastRequest(),
                'response' => $client->getLastResponse()
            ]);
            break;
            
        default:
            sendError("Unknown endpoint: $path", 404);
    }
    
} catch (Exception $e) {
    error_log("Tebra API Bridge error: " . $e->getMessage());
    sendError("API error: " . $e->getMessage(), 500);
}

?>