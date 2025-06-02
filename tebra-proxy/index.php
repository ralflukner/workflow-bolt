<?php

/**
 * Tebra SOAP API Proxy Server - HIPAA Compliant
 * Provides REST endpoints that internally use PHP SoapClient to communicate with Tebra
 * Returns JSON responses for easy consumption by Firebase Functions
 *
 * Security Features:
 * - API Key authentication
 * - Request logging for audit trails
 * - Input validation and sanitization
 * - Rate limiting
 * - CORS restrictions
 */

// Security: Disable error display in production
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Security headers
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// CORS - Restrict to Firebase Functions domains only
$allowed_origins = [
    'https://us-central1-luknerlumina-firebase.cloudfunctions.net',
    'https://luknerlumina-firebase.web.app',
    'http://localhost:5001', // For development
    'http://127.0.0.1:5001'  // For development
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');

// Handle OPTIONS requests for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Security: API Key authentication
function validateApiKey()
{
    $api_key = getenv('API_KEY') ?: 'secure-random-key-change-in-production';
    $provided_key = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';

    if (empty($provided_key) || !hash_equals($api_key, $provided_key)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid API key']);
        logRequest('UNAUTHORIZED', 'Invalid API key attempt');
        exit();
    }
}

// Security: Request logging for HIPAA audit trails
function logRequest($status, $message = '', $data = null)
{
    $log_entry = [
        'timestamp' => date('c'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
        'uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'status' => $status,
        'message' => $message,
        'execution_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']
    ];

    // Don't log sensitive data in production
    if (getenv('LOG_LEVEL') === 'debug' && $data) {
        $log_entry['data'] = $data;
    }

    error_log('TEBRA_PROXY: ' . json_encode($log_entry));
}

// Security: Input validation and sanitization
function validateInput($input, $type = 'string', $max_length = 255)
{
    if (empty($input)) {
        return null;
    }

    switch ($type) {
        case 'date':
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $input)) {
                throw new InvalidArgumentException('Invalid date format');
            }
            break;
        case 'id':
            if (!ctype_digit($input)) {
                throw new InvalidArgumentException('Invalid ID format');
            }
            break;
        case 'string':
        default:
            if (strlen($input) > $max_length) {
                throw new InvalidArgumentException('Input too long');
            }
            $input = filter_var($input, FILTER_SANITIZE_STRING);
            break;
    }

    return $input;
}

// Rate limiting (simple implementation)
function checkRateLimit()
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $rate_limit_file = "/tmp/rate_limit_$ip";
    $max_requests = 100; // requests per minute
    $window = 60; // seconds

    if (file_exists($rate_limit_file)) {
        $data = json_decode(file_get_contents($rate_limit_file), true);
        $current_time = time();

        if ($current_time - $data['start_time'] < $window) {
            if ($data['count'] >= $max_requests) {
                http_response_code(429);
                echo json_encode(['success' => false, 'error' => 'Rate limit exceeded']);
                logRequest('RATE_LIMITED', 'Too many requests');
                exit();
            }
            $data['count']++;
        } else {
            $data = ['start_time' => $current_time, 'count' => 1];
        }
    } else {
        $data = ['start_time' => time(), 'count' => 1];
    }

    file_put_contents($rate_limit_file, json_encode($data));
}

// Start request processing
$start_time = microtime(true);

// Apply security checks
checkRateLimit();
validateApiKey();

// Configuration from environment variables
$TEBRA_USERNAME = getenv('TEBRA_SOAP_USERNAME') ?: 'work-flow@luknerclinic.com';
$TEBRA_PASSWORD = getenv('TEBRA_SOAP_PASSWORD') ?: 'Y2ISY-x@mf1B4renpKHV3w49';
$TEBRA_CUSTKEY = getenv('TEBRA_SOAP_CUSTKEY') ?: 'j57wt68dc39q';
$TEBRA_WSDL = getenv('TEBRA_SOAP_WSDL') ?: 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';

/**
 * Create Tebra SOAP client with proper authentication
 */
function createTebraClient($wsdl, $username, $password, $customerKey)
{
    try {
        $client = new SoapClient($wsdl, array(
            'trace' => 1,
            'exceptions' => true,
            'cache_wsdl' => WSDL_CACHE_NONE,
            'connection_timeout' => 30,
            'user_agent' => 'LuknerClinic-TebraProxy/1.0 (HIPAA-Compliant)'
        ));
        return $client;
    } catch (Exception $e) {
        logRequest('ERROR', 'SOAP client creation failed: ' . $e->getMessage());
        return array('error' => 'Failed to create SOAP client: ' . $e->getMessage());
    }
}

/**
 * Create request header for Tebra API
 */
function createRequestHeader($username, $password, $customerKey)
{
    return array(
        'RequestHeader' => array(
            'User' => $username,
            'Password' => $password,
            'CustomerKey' => $customerKey
        )
    );
}

/**
 * Send error response
 */
function sendError($message, $code = 500)
{
    http_response_code($code);
    $response = array(
        'success' => false,
        'error' => $message,
        'timestamp' => date('c')
    );
    echo json_encode($response);
    logRequest('ERROR', $message);
    exit();
}

/**
 * Send success response
 */
function sendSuccess($data)
{
    $response = array(
        'success' => true,
        'data' => $data,
        'timestamp' => date('c')
    );
    echo json_encode($response);
    logRequest('SUCCESS', 'Request completed');
    exit();
}

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Get the endpoint
$endpoint = $pathParts[0] ?? '';

// Handle different endpoints
try {
    $client = createTebraClient($TEBRA_WSDL, $TEBRA_USERNAME, $TEBRA_PASSWORD, $TEBRA_CUSTKEY);

    if (is_array($client) && isset($client['error'])) {
        sendError($client['error']);
    }

    switch ($endpoint) {
        case 'test':
        case 'health':
            // Health check endpoint
            sendSuccess(array(
                'status' => 'healthy',
                'message' => 'Tebra SOAP Proxy is running (HIPAA Compliant)',
                'timestamp' => date('c'),
                'version' => '1.0.0'
            ));
            break;

        case 'providers':
            // Get providers
            $request = createRequestHeader($TEBRA_USERNAME, $TEBRA_PASSWORD, $TEBRA_CUSTKEY);
            $params = array('request' => $request);

            $response = $client->GetProviders($params);

            // Extract provider data
            $providers = array();
            if (isset($response->GetProvidersResult->Providers->ProviderData)) {
                $providerData = $response->GetProvidersResult->Providers->ProviderData;
                $providers = is_array($providerData) ? $providerData : array($providerData);
            }

            sendSuccess(array(
                'providers' => $providers,
                'security' => $response->GetProvidersResult->SecurityResponse ?? null
            ));
            break;

        case 'appointments':
            // Get appointments - expects POST with fromDate and toDate
            if ($method !== 'POST') {
                sendError('POST method required for appointments endpoint', 405);
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $fromDate = validateInput($input['fromDate'] ?? date('Y-m-d'), 'date');
            $toDate = validateInput($input['toDate'] ?? date('Y-m-d'), 'date');

            $request = createRequestHeader($TEBRA_USERNAME, $TEBRA_PASSWORD, $TEBRA_CUSTKEY);
            $request['FromDate'] = $fromDate;
            $request['ToDate'] = $toDate;

            $params = array('request' => $request);
            $response = $client->GetAppointments($params);

            // Extract appointment data
            $appointments = array();
            if (isset($response->GetAppointmentsResult->Appointments->AppointmentData)) {
                $appointmentData = $response->GetAppointmentsResult->Appointments->AppointmentData;
                $appointments = is_array($appointmentData) ? $appointmentData : array($appointmentData);
            }

            sendSuccess(array(
                'appointments' => $appointments,
                'fromDate' => $fromDate,
                'toDate' => $toDate,
                'security' => $response->GetAppointmentsResult->SecurityResponse ?? null
            ));
            break;

        case 'patients':
            if ($method === 'GET' && isset($pathParts[1])) {
                // Get patient by ID
                $patientId = validateInput($pathParts[1], 'id');

                $request = createRequestHeader($TEBRA_USERNAME, $TEBRA_PASSWORD, $TEBRA_CUSTKEY);
                $request['PatientID'] = $patientId;

                $params = array('request' => $request);
                $response = $client->GetPatient($params);

                $patient = $response->GetPatientResult->Patients->PatientData ?? null;

                sendSuccess(array(
                    'patient' => $patient,
                    'security' => $response->GetPatientResult->SecurityResponse ?? null
                ));
            } elseif ($method === 'POST') {
                // Search patients
                $input = json_decode(file_get_contents('php://input'), true);

                $request = createRequestHeader($TEBRA_USERNAME, $TEBRA_PASSWORD, $TEBRA_CUSTKEY);

                // Add search criteria with validation
                foreach ($input as $key => $value) {
                    if ($key !== 'request') {
                        $request[$key] = validateInput($value);
                    }
                }

                $params = array('request' => $request);
                $response = $client->SearchPatients($params);

                // Extract patient data
                $patients = array();
                if (isset($response->SearchPatientsResult->Patients->PatientData)) {
                    $patientData = $response->SearchPatientsResult->Patients->PatientData;
                    $patients = is_array($patientData) ? $patientData : array($patientData);
                }

                sendSuccess(array(
                    'patients' => $patients,
                    'security' => $response->SearchPatientsResult->SecurityResponse ?? null
                ));
            } else {
                sendError('Invalid method for patients endpoint', 405);
            }
            break;

        case 'practices':
            // Get practices
            $request = createRequestHeader($TEBRA_USERNAME, $TEBRA_PASSWORD, $TEBRA_CUSTKEY);
            $params = array('request' => $request);

            $response = $client->GetPractices($params);

            // Extract practice data
            $practices = array();
            if (isset($response->GetPracticesResult->Practices->PracticeData)) {
                $practiceData = $response->GetPracticesResult->Practices->PracticeData;
                $practices = is_array($practiceData) ? $practiceData : array($practiceData);
            }

            sendSuccess(array(
                'practices' => $practices,
                'security' => $response->GetPracticesResult->SecurityResponse ?? null
            ));
            break;

        default:
            sendError('Unknown endpoint: ' . $endpoint, 404);
    }
} catch (SoapFault $fault) {
    logRequest('SOAP_FAULT', $fault->faultstring);
    sendError('SOAP Fault: ' . $fault->faultstring);
} catch (InvalidArgumentException $e) {
    sendError('Invalid input: ' . $e->getMessage(), 400);
} catch (Exception $e) {
    logRequest('ERROR', $e->getMessage());
    sendError('Error: ' . $e->getMessage());
}
