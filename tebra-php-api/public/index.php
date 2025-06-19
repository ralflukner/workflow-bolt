<?php

declare(strict_types=1);

use LuknerLumina\TebraApi\TebraHttpClient;
use LuknerLumina\TebraApi\SecretManager;

require_once __DIR__ . '/../vendor/autoload.php';
// Initialise OpenTelemetry tracing (safe-no-op if disabled)
require_once __DIR__ . '/../src/tracing.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit; // Preflight request
}

// Simple routing based on path
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Health check endpoint
if ($method === 'GET' && ($path === '/' || $path === '/health')) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'healthy', 'timestamp' => date(DATE_ATOM)]);
    exit;
}

// Comprehensive health status endpoint with request logs
if ($method === 'GET' && $path === '/health/status') {
    header('Content-Type: application/json');
    try {
        $client = new TebraHttpClient();
        $healthStatus = $client->getHealthStatus();
        echo json_encode([
            'status' => 'operational',
            'timestamp' => date(DATE_ATOM),
            'health_metrics' => $healthStatus
        ]);
    } catch (\Exception $e) {
        echo json_encode([
            'status' => 'error',
            'timestamp' => date(DATE_ATOM),
            'error' => 'Failed to retrieve health status: ' . $e->getMessage()
        ]);
    }
    exit;
}

// Debug endpoint – disabled in production
if ($method === 'GET' && $path === '/debug/secrets' && false /* remove or protect */) {
    header('Content-Type: application/json');
    $username = getenv('TEBRA_USERNAME') ?: '';
    $password = getenv('TEBRA_PASSWORD') ?: '';
    $customerKey = getenv('TEBRA_CUSTOMER_KEY') ?: '';
    $internalKey = getenv('INTERNAL_API_KEY') ?: '';
    
    echo json_encode([
        'status' => 'debug_info',
        'timestamp' => date(DATE_ATOM),
        'secrets' => [
            'username_length' => strlen($username),
            'username_first_chars' => substr($username, 0, 10) . '...',
            'password_length' => strlen($password),
            'password_first_chars' => substr($password, 0, 8) . '...',
            'customer_key_length' => strlen($customerKey),
            'customer_key_value' => $customerKey, // This one is safe to show
            'internal_api_key_length' => strlen($internalKey)
        ]
    ]);
    exit;
}

// Validate API key header for all non-health requests
$internalApiKey = SecretManager::getSecret('tebra-internal-api-key', 'INTERNAL_API_KEY');
$clientApiKey   = $_SERVER['HTTP_X_API_KEY'] ?? '';

// If no API key is configured, allow access (for development)
if ($internalApiKey !== null && $internalApiKey !== '') {
    if (!hash_equals($internalApiKey, $clientApiKey)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit;
    }
}

if ($method !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

$rawBody = file_get_contents('php://input');
$body    = json_decode($rawBody, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Invalid JSON body']);
    exit;
}

$action = $body['action'] ?? '';
$params = $body['params'] ?? [];

$client = new TebraHttpClient();
$responseData = null;

try {
    switch ($action) {
        case 'getAppointments':
            $fromDate = $params['fromDate'] ?? null;
            $toDate   = $params['toDate'] ?? null;
            if (!$fromDate || !$toDate) {
                throw new InvalidArgumentException('fromDate and toDate are required');
            }

            // Validate date formats
            $fromDateTime = DateTime::createFromFormat('Y-m-d', $fromDate);
            $toDateTime = DateTime::createFromFormat('Y-m-d', $toDate);
            
            if (!$fromDateTime || !$toDateTime) {
                throw new InvalidArgumentException('Invalid date format. Dates must be in Y-m-d format (e.g., 2024-03-20)');
            }

            // Validate date range
            if ($fromDateTime > $toDateTime) {
                throw new InvalidArgumentException('fromDate must be before or equal to toDate');
            }

            $responseData = $client->getAppointments($fromDate, $toDate);
            break;
        case 'getProviders':
            $responseData = $client->getProviders();
            break;
        case 'getPatient':
            $patientId = $params['patientId'] ?? null;
            if (!$patientId) {
                throw new InvalidArgumentException('patientId is required');
            }
            $responseData = $client->getPatient($patientId);
            break;
        case 'searchPatients':
            $lastName = $params['lastName'] ?? null;
            if (!$lastName) {
                throw new InvalidArgumentException('lastName is required for patient search');
            }
            $responseData = $client->searchPatients($lastName);
            break;
        case 'createAppointment':
            $appointmentData = $params['appointmentData'] ?? null;
            if (!$appointmentData) {
                throw new InvalidArgumentException('appointmentData is required');
            }
            $responseData = $client->createAppointment($appointmentData);
            break;
        case 'updateAppointment':
            $appointmentData = $params['appointmentData'] ?? null;
            if (!$appointmentData) {
                throw new InvalidArgumentException('appointmentData is required');
            }
            $responseData = $client->updateAppointment($appointmentData);
            break;
        case 'health':
            $responseData = ['status' => 'healthy'];
            break;
        case 'testConnection':
            $responseData = $client->testConnection();
            break;
        case 'getHealthStatus':
            $responseData = $client->getHealthStatus();
            break;
        default:
            throw new InvalidArgumentException('Unknown action: ' . $action);
    }

    http_response_code(200);
    echo json_encode(['success' => true, 'data' => $responseData]);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage(),
        'type' => 'validation_error',
        'timestamp' => date(DATE_ATOM)
    ]);
} catch (\SoapFault $e) {
    http_response_code(503);
    header('Content-Type: application/json');
    
    // Provide specific SOAP error details
    $errorMessage = 'Tebra SOAP API Error: ' . $e->getMessage();
    $errorDetails = [
        'success' => false,
        'error' => $errorMessage,
        'type' => 'soap_fault',
        'fault_code' => $e->faultcode ?? 'Unknown',
        'fault_string' => $e->faultstring ?? $e->getMessage(),
        'timestamp' => date(DATE_ATOM)
    ];
    
    // Add specific error context based on common Tebra errors
    if (strpos($e->getMessage(), 'Object reference not set') !== false) {
        $errorDetails['error'] = 'Tebra API Error: Server-side null reference exception (ValidationHelper bug)';
        $errorDetails['suggestion'] = 'This is a known Tebra server issue. Try a different date range or contact Tebra support.';
        $errorDetails['tebra_ticket'] = '#112623';
    } elseif (strpos($e->getMessage(), 'Unable to find user') !== false) {
        $errorDetails['error'] = 'Tebra Authentication Error: User account not found or inactive';
        $errorDetails['suggestion'] = 'Verify Tebra account activation for work-flow@luknerclinic.com';
    } elseif (strpos($e->getMessage(), 'InternalServiceFault') !== false) {
        $errorDetails['error'] = 'Tebra Backend Error: Internal service fault';
        $errorDetails['suggestion'] = 'Tebra backend is experiencing issues. Retry in a few minutes.';
    }
    
    error_log('[TEBRA_SOAP_FAULT] ' . json_encode($errorDetails));
    echo json_encode($errorDetails);
} catch (\RuntimeException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    
    $errorDetails = [
        'success' => false,
        'error' => 'Configuration Error: ' . $e->getMessage(),
        'type' => 'configuration_error',
        'timestamp' => date(DATE_ATOM)
    ];
    
    // Check for specific configuration issues
    if (strpos($e->getMessage(), 'Required environment variable') !== false) {
        $errorDetails['suggestion'] = 'Check Cloud Run environment variables configuration';
    }
    
    error_log('[TEBRA_CONFIG_ERROR] ' . json_encode($errorDetails));
    echo json_encode($errorDetails);
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    
    // Log the full error details for debugging
    $errorDetails = [
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ];
    error_log('[TEBRA_FATAL_ERROR] ' . json_encode($errorDetails));
    
    // Return specific error information
    echo json_encode([
        'success' => false,
        'error' => 'PHP Service Error: ' . $e->getMessage(),
        'type' => 'internal_error',
        'error_class' => get_class($e),
        'error_location' => basename($e->getFile()) . ':' . $e->getLine(),
        'timestamp' => date(DATE_ATOM),
        'correlation_id' => uniqid('error_', true)
    ]);
} 