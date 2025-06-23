<?php

declare(strict_types=1);

use LuknerLumina\TebraApi\TebraHttpClient;
use LuknerLumina\TebraApi\SecretManager;

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../src/tracing.php';

// Enable CORS for all origins (adjust in production)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Simple routing based on path
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Remove /api prefix if present
$path = preg_replace('/^\/api/', '', $path);

try {
    $client = new TebraHttpClient();
    $responseData = null;
    
    // Parse request body for POST requests
    $body = [];
    if ($method === 'POST') {
        $rawBody = file_get_contents('php://input');
        $body = json_decode($rawBody, true) ?? [];
    }
    
    // Route to appropriate method
    switch ($path) {
        case '/testConnection':
            $responseData = $client->testConnection();
            break;
            
        case '/getPatient':
            $patientId = $body['patientId'] ?? $_GET['patientId'] ?? null;
            if (!$patientId) {
                throw new \InvalidArgumentException('patientId is required');
            }
            $responseData = $client->getPatient($patientId);
            break;
            
        case '/searchPatients':
            $lastName = $body['lastName'] ?? $_GET['lastName'] ?? null;
            if (!$lastName) {
                throw new \InvalidArgumentException('lastName is required');
            }
            $responseData = $client->searchPatients($lastName);
            break;
            
        case '/getAppointments':
            $fromDate = $body['fromDate'] ?? $_GET['fromDate'] ?? null;
            $toDate = $body['toDate'] ?? $_GET['toDate'] ?? null;
            if (!$fromDate || !$toDate) {
                throw new \InvalidArgumentException('fromDate and toDate are required');
            }
            
            // Validate date formats
            $fromDateTime = \DateTime::createFromFormat('Y-m-d', $fromDate);
            $toDateTime = \DateTime::createFromFormat('Y-m-d', $toDate);
            
            if (!$fromDateTime || !$toDateTime) {
                throw new \InvalidArgumentException('Invalid date format. Use Y-m-d format');
            }
            
            if ($fromDateTime > $toDateTime) {
                throw new \InvalidArgumentException('fromDate must be before or equal to toDate');
            }
            
            $responseData = $client->getAppointments($fromDate, $toDate);
            break;
            
        case '/getProviders':
            $responseData = $client->getProviders();
            break;
            
        case '/createAppointment':
            if ($method !== 'POST') {
                throw new \InvalidArgumentException('POST method required');
            }
            $appointmentData = $body['appointmentData'] ?? $body;
            if (!$appointmentData) {
                throw new \InvalidArgumentException('appointmentData is required');
            }
            $responseData = $client->createAppointment($appointmentData);
            break;
            
        case '/updateAppointment':
            if ($method !== 'POST') {
                throw new \InvalidArgumentException('POST method required');
            }
            $appointmentData = $body['appointmentData'] ?? $body;
            if (!$appointmentData) {
                throw new \InvalidArgumentException('appointmentData is required');
            }
            $responseData = $client->updateAppointment($appointmentData);
            break;
            
        case '/syncSchedule':
            if ($method !== 'POST') {
                throw new \InvalidArgumentException('POST method required');
            }
            $date = $body['date'] ?? null;
            if (!$date) {
                // Default to today in Chicago timezone
                $date = (new \DateTime('today', new \DateTimeZone('America/Chicago')))->format('Y-m-d');
            }
            $responseData = $client->syncSchedule($date);
            break;
            
        case '/debugProviders':
            // Debug endpoint to check available providers
            $responseData = [
                'providers' => $client->getProviders(),
                'timestamp' => date('c')
            ];
            break;
            
        case '/health':
        case '/':
            $responseData = [
                'status' => 'healthy',
                'service' => 'Tebra PHP API',
                'timestamp' => date('c'),
                'endpoints' => [
                    '/testConnection',
                    '/getPatient',
                    '/searchPatients', 
                    '/getAppointments',
                    '/getProviders',
                    '/createAppointment',
                    '/updateAppointment',
                    '/syncSchedule'
                ]
            ];
            break;
            
        default:
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Endpoint not found: ' . $path,
                'available_endpoints' => [
                    '/testConnection',
                    '/getPatient',
                    '/searchPatients',
                    '/getAppointments', 
                    '/getProviders',
                    '/createAppointment',
                    '/updateAppointment',
                    '/syncSchedule'
                ]
            ]);
            exit;
    }
    
    // Return successful response
    echo json_encode($responseData);
    
} catch (\InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'type' => 'validation_error'
    ]);
} catch (\SoapFault $e) {
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'error' => 'Tebra SOAP Error: ' . $e->getMessage(),
        'type' => 'soap_fault'
    ]);
} catch (\Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'type' => 'server_error'
    ]);
}