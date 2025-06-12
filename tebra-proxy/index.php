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
    'http://localhost:5001', // For development (Firebase Functions)
    'http://127.0.0.1:5001',  // For development (Firebase Functions)
    'http://localhost:3000', // For development (Vite dev server)
    'http://127.0.0.1:3000'  // For development (Vite dev server)
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

// HIPAA-Compliant API Key authentication
function validateApiKey()
{
    $api_key = getenv('API_KEY');
    $provided_key = $_SERVER['HTTP_X_API_KEY'] ?? '';

    // Fail securely if no API key configured
    if (!$api_key) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Service configuration error']);
        logRequest('CONFIG_ERROR', 'Missing API key configuration');
        exit();
    }

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

function getCacheKey($type, $params) {
    return $type . '_' . md5(json_encode($params));
}

function getCachedData($cacheKey, $ttl = 300) {
    $cacheFile = '/tmp/' . $cacheKey . '.cache';
    if (file_exists($cacheFile)) {
        $data = json_decode(file_get_contents($cacheFile), true);
        if ($data && isset($data['timestamp']) && (time() - $data['timestamp']) < $ttl) {
            return $data['data'];
        }
    }
    return null;
}

function setCachedData($cacheKey, $data) {
    $cacheFile = '/tmp/' . $cacheKey . '.cache';
    $cacheData = [
        'timestamp' => time(),
        'data' => $data
    ];
    file_put_contents($cacheFile, json_encode($cacheData));
}

function getAppointmentsWithCache($request, $client, $fromDate, $toDate) {
    $cacheKey = getCacheKey('appointments', ['fromDate' => $fromDate, 'toDate' => $toDate]);
    
    // Try to get from cache first
    $cachedData = getCachedData($cacheKey, 300); // 5 minute cache
    if ($cachedData !== null) {
        logRequest('CACHE_HIT', "Serving appointments from cache for $fromDate to $toDate");
        return [
            'appointments' => $cachedData['appointments'],
            'fromDate' => $fromDate,
            'toDate' => $toDate,
            'security' => $cachedData['security'] ?? null,
            'cached' => true,
            'cache_timestamp' => $cachedData['cache_timestamp'] ?? null
        ];
    }
    
    // Cache miss - fetch from Tebra API
    logRequest('CACHE_MISS', "Fetching appointments from Tebra API for $fromDate to $toDate");
    
    try {
        $params = array('request' => $request);
        $response = $client->GetAppointments($params);
        
        // Extract appointment data
        $appointments = array();
        if (isset($response->GetAppointmentsResult->Appointments->AppointmentData)) {
            $appointmentData = $response->GetAppointmentsResult->Appointments->AppointmentData;
            $appointments = is_array($appointmentData) ? $appointmentData : array($appointmentData);
        }
        
        $result = [
            'appointments' => $appointments,
            'security' => $response->GetAppointmentsResult->SecurityResponse ?? null,
            'cache_timestamp' => date('c')
        ];
        
        // Cache the result
        setCachedData($cacheKey, $result);
        
        return [
            'appointments' => $appointments,
            'fromDate' => $fromDate,
            'toDate' => $toDate,
            'security' => $result['security'],
            'cached' => false,
            'cache_timestamp' => $result['cache_timestamp']
        ];
        
    } catch (Exception $e) {
        logRequest('ERROR', 'Tebra API call failed: ' . $e->getMessage());
        throw $e;
    }
}

// Start request processing
$start_time = microtime(true);

// Apply security checks
try {
    // Validate API key
    validateApiKey();
    
    // Check rate limit
    checkRateLimit();
    
    // Get endpoint from URL
    $pathParts = explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'));
    $endpoint = $pathParts[0] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];
    
    // HIPAA-Compliant credential loading - NO hardcoded fallbacks
    $TEBRA_USERNAME = getenv('TEBRA_SOAP_USERNAME');
    $TEBRA_PASSWORD = getenv('TEBRA_SOAP_PASSWORD'); 
    $TEBRA_CUSTKEY = getenv('TEBRA_SOAP_CUSTKEY');
    $TEBRA_WSDL = getenv('TEBRA_SOAP_WSDL') ?: 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';

    // Fail securely if credentials missing
    if (!$TEBRA_USERNAME || !$TEBRA_PASSWORD || !$TEBRA_CUSTKEY) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Service configuration error']);
        logRequest('CONFIG_ERROR', 'Missing Tebra credentials');
        exit();
    }

    // Create Tebra client
    $client = createTebraClient(
        $TEBRA_WSDL,
        $TEBRA_USERNAME,
        $TEBRA_PASSWORD,
        $TEBRA_CUSTKEY
    );
    
    // Route to appropriate endpoint
    switch ($endpoint) {
        case 'health':
            // Health check endpoint with environment diagnostics
            $diagnostics = array(
                'php_version' => PHP_VERSION,
                'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
                'server_name' => $_SERVER['SERVER_NAME'] ?? 'unknown',
                'request_time' => $_SERVER['REQUEST_TIME'] ?? time(),
                'memory_usage' => memory_get_usage(true),
                'curl_version' => curl_version()['version'] ?? 'unknown'
            );

            // Add cache status to health check
            $cacheStatus = array();
            $today = date('Y-m-d');
            $tomorrow = date('Y-m-d', strtotime('+1 day'));
            
            $todayCache = getCacheKey('appointments', ['fromDate' => $today, 'toDate' => $today]);
            $tomorrowCache = getCacheKey('appointments', ['fromDate' => $tomorrow, 'toDate' => $tomorrow]);
            
            $cacheStatus['today_cached'] = getCachedData($todayCache) !== null;
            $cacheStatus['tomorrow_cached'] = getCachedData($tomorrowCache) !== null;
            
            sendSuccess(array(
                'status' => 'healthy',
                'message' => 'Tebra SOAP Proxy is running (HIPAA Compliant)',
                'timestamp' => date('c'),
                'version' => '1.0.0',
                'cache_status' => $cacheStatus,
                'diagnostics' => $diagnostics
            ));
            break;

        case 'warm-cache':
            // Warm cache for today and tomorrow - runs in background
            if ($method !== 'POST') {
                sendError('POST method required for cache warming', 405);
            }
            
            $today = date('Y-m-d');
            $tomorrow = date('Y-m-d', strtotime('+1 day'));
            $warmed = array();
            
            // Warm today's cache
            try {
                $request = array(
                    'RequestHeader' => array(
                        'User' => $TEBRA_USERNAME,
                        'Password' => $TEBRA_PASSWORD,
                        'CustomerKey' => $TEBRA_CUSTKEY
                    ),
                    'Filter' => array(
                        'StartDate' => date('n/j/Y', strtotime($today)) . ' 12:00:00 AM',
                        'EndDate' => date('n/j/Y', strtotime($today)) . ' 11:59:59 PM',
                        'PracticeID' => '67149',
                        'TimeZoneOffsetFromGMT' => '-6'
                    ),
                    'Fields' => array('ID' => true, 'PatientFullName' => true, 'StartDate' => true)
                );
                
                $result = getAppointmentsWithCache($request, $client, $today, $today);
                $warmed['today'] = count($result['appointments']);
            } catch (Exception $e) {
                $warmed['today_error'] = $e->getMessage();
            }
            
            // Warm tomorrow's cache
            try {
                $request['Filter']['StartDate'] = date('n/j/Y', strtotime($tomorrow)) . ' 12:00:00 AM';
                $request['Filter']['EndDate'] = date('n/j/Y', strtotime($tomorrow)) . ' 11:59:59 PM';
                
                $result = getAppointmentsWithCache($request, $client, $tomorrow, $tomorrow);
                $warmed['tomorrow'] = count($result['appointments']);
            } catch (Exception $e) {
                $warmed['tomorrow_error'] = $e->getMessage();
            }
            
            sendSuccess(array(
                'message' => 'Cache warming completed',
                'warmed' => $warmed,
                'today' => $today,
                'tomorrow' => $tomorrow
            ));
            break;

        case 'ping':
            // Test basic connectivity to Tebra WSDL endpoint
            $ch = curl_init('https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl');
            curl_setopt($ch, CURLOPT_NOBODY, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            $result = curl_exec($ch);
            $err = curl_error($ch);
            $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $info = curl_getinfo($ch);
            curl_close($ch);

            sendSuccess(array(
                'curl_ok' => $result !== false,
                'http_status' => $status,
                'error' => $err,
                'connect_time' => $info['connect_time'] ?? 0,
                'total_time' => $info['total_time'] ?? 0,
                'ssl_verify_result' => $info['ssl_verify_result'] ?? 'unknown',
                'php_version' => phpversion(),
                'openssl_version' => OPENSSL_VERSION_TEXT
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
            
            // Validate 60-day limit for Tebra API
            $daysDiff = abs((strtotime($toDate) - strtotime($fromDate)) / (60 * 60 * 24));
            if ($daysDiff > 60) {
                sendError('Date range cannot exceed 60 days (Tebra API limitation)', 400);
            }

            $request = array(
                'RequestHeader' => array(
                    'User' => $TEBRA_USERNAME,
                    'Password' => $TEBRA_PASSWORD,
                    'CustomerKey' => $TEBRA_CUSTKEY
                ),
                'Filter' => array(
                    'StartDate' => date('n/j/Y', strtotime($fromDate)) . ' 12:00:00 AM',
                    'EndDate' => date('n/j/Y', strtotime($toDate)) . ' 11:55:00 PM'
                ),
                'Fields' => array(
                    'ID' => true,
                    'CreatedDate' => true,
                    'LastModifiedDate' => true,
                    'PracticeName' => true,
                    'Type' => true,
                    'PatientID' => true,
                    'PatientFullName' => true,
                    'StartDate' => true,
                    'EndDate' => true,
                    'AppointmentReason1' => true,
                    'Notes' => true,
                    'PracticeID' => true,
                    'ServiceLocationName' => true,
                    'ResourceName1' => true,
                    'ConfirmationStatus' => true,
                    'AllDay' => true,
                    'Recurring' => true
                )
            );

            $params = array('request' => $request);
            
            // Production logging (reduced verbosity)
            $isDebugMode = (getenv('LOG_LEVEL') === 'debug');
            
            if ($isDebugMode) {
                error_log('TEBRA_DEBUG: Request params: ' . json_encode($request));
            }
            
            try {
                $response = $client->GetAppointments($params);
                
                if ($isDebugMode) {
                    // Capture raw SOAP XML for debugging (only in debug mode)
                    $lastRequestXML = $client->__getLastRequest();
                    $lastResponseXML = $client->__getLastResponse();
                    
                    error_log('TEBRA_DEBUG: Raw SOAP Request XML: ' . $lastRequestXML);
                    error_log('TEBRA_DEBUG: Raw SOAP Response XML (first 500 chars): ' . substr($lastResponseXML, 0, 500));
                }
                
                if ($response && isset($response->GetAppointmentsResult)) {
                    if (isset($response->GetAppointmentsResult->ErrorResponse) && 
                        $response->GetAppointmentsResult->ErrorResponse->IsError) {
                        error_log('TEBRA_ERROR: ' . $response->GetAppointmentsResult->ErrorResponse->ErrorMessage);
                    }
                }
                
            } catch (SoapFault $fault) {
                error_log('SOAP FAULT: ' . $fault->faultstring);
                error_log('SOAP FAULT CODE: ' . $fault->faultcode);
                error_log('SOAP FAULT DETAIL: ' . print_r($fault->detail, true));
                sendError('SOAP Fault: ' . $fault->faultstring);
            } catch (Exception $e) {
                error_log('SOAP EXCEPTION: ' . $e->getMessage());
                sendError('SOAP Exception: ' . $e->getMessage());
            }

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
