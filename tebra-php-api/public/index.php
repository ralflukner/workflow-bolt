<?php

declare(strict_types=1);

use LuknerLumina\TebraApi\TebraHttpClient;

require_once __DIR__ . '/../vendor/autoload.php';

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

// Validate API key header for all non-health requests
$internalApiKey = getenv('INTERNAL_API_KEY') ?: '';
$clientApiKey   = $_SERVER['HTTP_X_API_KEY'] ?? '';
if ($internalApiKey === '') {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server misconfiguration']);
    exit;
}
if (!hash_equals($internalApiKey, $clientApiKey)) {
    http_response_code(401);
     echo json_encode(['success' => false, 'error' => 'Unauthorized']);
     exit;
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
        case 'getPatients':
            $patientIds = $params['patientIds'] ?? [];
            if (!is_array($patientIds) || empty($patientIds)) {
                throw new InvalidArgumentException('patientIds must be a non-empty array');
            }
            // The Tebra SOAP API does not support batch; you might need to implement loop. For now, not implemented.
            $responseData = [
                'success' => false,
                'message' => 'getPatients not yet implemented',
            ];
            break;
        case 'health':
            $responseData = ['status' => 'healthy'];
            break;
        default:
            throw new InvalidArgumentException('Unknown action: ' . $action);
    }

    http_response_code(200);
    echo json_encode(['success' => true, 'data' => $responseData]);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'An internal server error occurred']);
} 