<?php

declare(strict_types=1);

namespace LuknerLumina\TebraApi;

use LuknerLumina\TebraApi\SecretManager;

/**
 * Tebra HTTP Client for PHP
 * Based on official Tebra API Integration Technical Guide
 * Uses proper SoapClient implementation as per Tebra documentation
 */
class TebraHttpClient {
    private $wsdlUrl;
    private $username;
    private $password;
    private $customerKey;
    private $client;
    
    private $healthStatus = [];
    private $requestLog = [];
    private $maxLogEntries = 100;
    
    public function __construct() {
        // Read from Google Secret Manager with environment variable fallback
        $this->username = SecretManager::getRequiredSecret('tebra-username', 'TEBRA_USERNAME');
        $this->password = SecretManager::getRequiredSecret('tebra-password', 'TEBRA_PASSWORD');
        $this->customerKey = SecretManager::getRequiredSecret('tebra-customer-key', 'TEBRA_CUSTOMER_KEY');
        // Use the working WSDL URL
        $this->wsdlUrl = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';
        
        // Debug logging with hashes for credential verification (sensitive data removed)
        error_log("Tebra credentials debug:");
        error_log("  Username length: " . strlen($this->username) . ", hash: " . substr(md5($this->username), 0, 8));
        error_log("  Password length: " . strlen($this->password) . ", hash: " . substr(md5($this->password), 0, 8));
        error_log("  Customer key length: " . strlen($this->customerKey));
        
        $this->initializeClient();
        $this->initializeHealthStatus();
    }
    
    /**
     * Initialize health status tracking
     */
    private function initializeHealthStatus() {
        $this->healthStatus = [
            'last_success' => null,
            'last_failure' => null,
            'success_count' => 0,
            'failure_count' => 0,
            'uptime_start' => date('c'),
            'method_stats' => []
        ];
    }
    
    /**
     * Log a request with redacted sensitive data
     */
    private function logRequest($method, $params, $success, $error = null, $duration = null) {
        // Redact sensitive information
        $redactedParams = $this->redactSensitiveData($params);
        
        $logEntry = [
            'timestamp' => date('c'),
            'method' => $method,
            'params' => $redactedParams,
            'success' => $success,
            'error' => $error,
            'duration_ms' => $duration
        ];
        
        // Add to request log (maintain max size)
        array_unshift($this->requestLog, $logEntry);
        if (count($this->requestLog) > $this->maxLogEntries) {
            array_pop($this->requestLog);
        }
        
        // Update health status
        $this->updateHealthStatus($method, $success, $error);
        
        // Log to error_log for Cloud Run
        $logMessage = sprintf(
            "[TEBRA_API] %s %s: %s%s%s",
            $method,
            $success ? 'SUCCESS' : 'FAILED',
            json_encode($redactedParams),
            $error ? ' - Error: ' . $error : '',
            $duration ? ' - Duration: ' . $duration . 'ms' : ''
        );
        error_log($logMessage);
    }
    
    /**
     * Update health status metrics
     */
    private function updateHealthStatus($method, $success, $error = null) {
        if ($success) {
            $this->healthStatus['last_success'] = date('c');
            $this->healthStatus['success_count']++;
        } else {
            $this->healthStatus['last_failure'] = date('c');
            $this->healthStatus['failure_count']++;
        }
        
        // Track per-method statistics
        if (!isset($this->healthStatus['method_stats'][$method])) {
            $this->healthStatus['method_stats'][$method] = [
                'success_count' => 0,
                'failure_count' => 0,
                'last_error' => null
            ];
        }
        
        if ($success) {
            $this->healthStatus['method_stats'][$method]['success_count']++;
        } else {
            $this->healthStatus['method_stats'][$method]['failure_count']++;
            $this->healthStatus['method_stats'][$method]['last_error'] = $error;
        }
    }
    
    /**
     * Redact sensitive data from parameters with partial visibility for debugging
     */
    private function redactSensitiveData($data) {
        if (is_array($data)) {
            $redacted = [];
            foreach ($data as $key => $value) {
                $lowerKey = strtolower($key);
                if (in_array($lowerKey, ['password', 'user', 'username', 'customerkey', 'ssn', 'dob'])) {
                    $redacted[$key] = $this->partialRedact($value, $lowerKey);
                } elseif (is_array($value) || is_object($value)) {
                    $redacted[$key] = $this->redactSensitiveData($value);
                } else {
                    $redacted[$key] = $value;
                }
            }
            return $redacted;
        } elseif (is_object($data)) {
            return $this->redactSensitiveData((array)$data);
        }
        return $data;
    }
    
    /**
     * Partially redact sensitive information for debugging
     */
    private function partialRedact($value, $type) {
        if (!is_string($value) || empty($value)) {
            return '[EMPTY]';
        }
        
        $length = strlen($value);
        
        switch ($type) {
            case 'password':
                // Show length and first 2 chars
                if ($length <= 3) {
                    return str_repeat('*', $length);
                }
                return substr($value, 0, 2) . str_repeat('*', $length - 2) . " (len: $length)";
                
            case 'user':
            case 'username':
                // Show first 3 and last 2 chars
                if ($length <= 5) {
                    return substr($value, 0, 1) . str_repeat('*', $length - 1);
                }
                return substr($value, 0, 3) . str_repeat('*', $length - 5) . substr($value, -2) . " (len: $length)";
                
            case 'customerkey':
                // Show first 4 and last 4 chars (typically UUIDs or long keys)
                if ($length <= 8) {
                    return str_repeat('*', $length);
                }
                return substr($value, 0, 4) . '...' . substr($value, -4) . " (len: $length)";
                
            case 'ssn':
                // Show last 4 digits only
                if ($length >= 4) {
                    return '***-**-' . substr($value, -4);
                }
                return str_repeat('*', $length);
                
            case 'dob':
                // Show year only
                if (preg_match('/(\d{4})/', $value, $matches)) {
                    return $matches[1] . '-**-**';
                }
                return '****-**-**';
                
            default:
                // Generic partial redaction
                if ($length <= 4) {
                    return str_repeat('*', $length);
                }
                return substr($value, 0, 2) . str_repeat('*', $length - 4) . substr($value, -2);
        }
    }
    
    /**
     * Get current health status
     */
    public function getHealthStatus() {
        $totalRequests = $this->healthStatus['success_count'] + $this->healthStatus['failure_count'];
        $successRate = $totalRequests > 0 ? 
            round(($this->healthStatus['success_count'] / $totalRequests) * 100, 2) : 0;
        
        return array_merge($this->healthStatus, [
            'total_requests' => $totalRequests,
            'success_rate' => $successRate,
            'recent_logs' => array_slice($this->requestLog, 0, 10)
        ]);
    }
    
    /**
     * Initialize SOAP client with proper configuration (from official guide)
     */
    private function initializeClient() {
        $options = [
            'soap_version' => SOAP_1_1,
            'trace' => true,
            'exceptions' => true,
            'cache_wsdl' => WSDL_CACHE_MEMORY,
            'features' => SOAP_SINGLE_ELEMENT_ARRAYS,
            'user_agent' => 'TebraSOAP-PHP-Client/1.0',
            'connection_timeout' => 15,
            'stream_context' => stream_context_create([
                'ssl' => [
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                    'allow_self_signed' => false
                ]
            ])
        ];
        
        // Use a simple file lock to avoid race conditions when multiple requests
        // try to initialise the SoapClient at the same time (Cloud Run concurrent threads).
        $lockPath = sys_get_temp_dir() . '/tebra_soap.lock';
        $lockHandle = @fopen($lockPath, 'c');
        if ($lockHandle === false) {
            // Fallback without lock if we cannot create the file
            $lockHandle = null;
        }

        if ($lockHandle) {
            flock($lockHandle, LOCK_EX);
        }

        try {
            $this->client = new \SoapClient($this->wsdlUrl, $options);
            error_log("Tebra SOAP client initialized successfully with WSDL: " . $this->wsdlUrl);
        } catch (\SoapFault $e) {
            error_log("SOAP Client initialization failed: " . $e->getMessage());
            // Re-throw the original SoapFault to preserve faultcode and detail information
            throw $e;
        } finally {
            if ($lockHandle) {
                flock($lockHandle, LOCK_UN);
                fclose($lockHandle);
            }
        }
    }
    
    /**
     * Create authentication header for all requests (based on working implementation)
     */
    private function createAuthHeader() {
        return [
            'CustomerKey' => $this->customerKey,
            'User' => $this->username,  // Note: 'User' not 'Username' - verified working
            'Password' => $this->password
        ];
    }
    
    /**
     * Handle SOAP faults and errors with detailed context
     */
    private function handleSoapFault($e, $method) {
        $errorContext = [
            'method' => $method,
            'fault_code' => $e->faultcode ?? 'Unknown',
            'message' => $e->getMessage(),
            'timestamp' => date('c')
        ];
        
        // Log detailed error information
        error_log("[TEBRA_SOAP_FAULT] Method: {$method}");
        error_log("[TEBRA_SOAP_FAULT] Code: " . ($e->faultcode ?? 'Unknown'));
        error_log("[TEBRA_SOAP_FAULT] Message: " . $e->getMessage());
        
        if ($this->client) {
            $lastRequest = $this->client->__getLastRequest();
            $lastResponse = $this->client->__getLastResponse();
            
            // Redact sensitive data from request before logging
            $redactedRequest = $this->redactSoapXml($lastRequest);
            error_log("[TEBRA_SOAP_FAULT] Last Request: " . $redactedRequest);
            error_log("[TEBRA_SOAP_FAULT] Last Response: " . $lastResponse);
            
            $errorContext['request_headers'] = $this->client->__getLastRequestHeaders();
            $errorContext['response_headers'] = $this->client->__getLastResponseHeaders();
        }
        
        // Create detailed error message based on known Tebra issues
        $detailedMessage = $e->getMessage();
        
        if (strpos($e->getMessage(), 'ValidationHelper') !== false) {
            $detailedMessage = "Tebra server bug in {$method}: ValidationHelper.ValidateDateTimeFields null reference. This is a known Tebra issue (ticket #112623).";
        } elseif (strpos($e->getMessage(), 'Could not connect to host') !== false) {
            $detailedMessage = "Cannot connect to Tebra SOAP API at {$this->wsdlUrl}. Network or firewall issue.";
        } elseif (strpos($e->getMessage(), 'Unauthorized') !== false) {
            $detailedMessage = "Tebra authentication failed for user: " . $this->partialRedact($this->username, 'username') . ". Check account activation.";
        }
        
        // Log to request history
        $this->logRequest($method, ['soap_fault' => true], false, $detailedMessage, null);
        
        // Re-throw with enhanced details
        throw new \SoapFault(
            $e->faultcode ?? 'Client', 
            $detailedMessage,
            null,
            array_merge((array)($e->detail ?? []), ['context' => $errorContext])
        );
    }
    
    /**
     * Redact sensitive data from SOAP XML
     */
    private function redactSoapXml($xml) {
        if (empty($xml)) return '[EMPTY]';
        
        // Redact password
        $xml = preg_replace('/<([^>]*Password[^>]*)>([^<]+)<\//', '<$1>[REDACTED]</', $xml);
        
        // Partially redact username (show first 3 chars)
        $xml = preg_replace_callback('/<([^>]*User[^>]*)>([^<]+)<\//', function($matches) {
            $value = $matches[2];
            $redacted = $this->partialRedact($value, 'username');
            return "<{$matches[1]}>{$redacted}</";
        }, $xml);
        
        // Partially redact customer key
        $xml = preg_replace_callback('/<([^>]*CustomerKey[^>]*)>([^<]+)<\//', function($matches) {
            $value = $matches[2];
            $redacted = $this->partialRedact($value, 'customerkey');
            return "<{$matches[1]}>{$redacted}</";
        }, $xml);
        
        return $xml;
    }
    
    /**
     * Test the API connection
     */
    public function testConnection() {
        try {
            $result = $this->getProviders();
            error_log("Tebra connection test successful");
            return [
                'success' => true,
                'message' => 'Connection test successful',
                'data' => $result,
                'timestamp' => date('c')
            ];
        } catch (\Exception $e) {
            error_log("Tebra connection test failed: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Connection test failed: ' . $e->getMessage(),
                'timestamp' => date('c')
            ];
        }
    }
    
    /**
     * Get appointments for a date range
     */
    public function getAppointments($fromDate = null, $toDate = null) {
        $startTime = microtime(true);
        $dateFrom = $fromDate ?: date('n/j/Y');
        $dateTo = $toDate ?: date('n/j/Y');
        
        try {
            // Use correct structure with Filter section as per Tebra XML
            $request = array (
                'RequestHeader' => array(
                    'User' => $this->username, 
                    'Password' => $this->password, 
                    'CustomerKey' => $this->customerKey
                ),
                'Fields' => array(), // Empty to get all fields
                'Filter' => array(
                    'StartDate' => $dateFrom,
                    'EndDate' => $dateTo
                )
            );

            $params = array('request' => $request);
            
            // Log the request attempt
            $this->logRequest('GetAppointments', [
                'fromDate' => $dateFrom,
                'toDate' => $dateTo,
                'action' => 'Attempted to get appointments for ' . $dateFrom . ' to ' . $dateTo
            ], false, null, null);
            
            $response = $this->client->GetAppointments($params)->GetAppointmentsResult;
            
            // Check for API errors
            if (isset($response->ErrorResponse) && $response->ErrorResponse->IsError) {
                throw new \Exception('Tebra API Error: ' . $response->ErrorResponse->ErrorMessage);
            }
            
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            // Log success
            $this->logRequest('GetAppointments', [
                'fromDate' => $dateFrom,
                'toDate' => $dateTo,
                'action' => 'Successfully retrieved appointments for ' . $dateFrom . ' to ' . $dateTo
            ], true, null, $duration);
            
            return [
                'success' => true,
                'data' => $response,
                'timestamp' => date('c'),
                'duration_ms' => $duration
            ];
            
        } catch (\SoapFault $e) {
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            $this->logRequest('GetAppointments', [
                'fromDate' => $dateFrom,
                'toDate' => $dateTo,
                'action' => 'Attempted to get appointments for ' . $dateFrom . ' to ' . $dateTo,
                'error' => $e->getMessage()
            ], false, $e->getMessage(), $duration);
            $this->handleSoapFault($e, 'GetAppointments');
        } catch (\Exception $e) {
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            $this->logRequest('GetAppointments', [
                'fromDate' => $dateFrom,
                'toDate' => $dateTo,
                'action' => 'Attempted to get appointments for ' . $dateFrom . ' to ' . $dateTo,
                'error' => $e->getMessage()
            ], false, $e->getMessage(), $duration);
            return [
                'success' => false,
                'message' => 'Failed to get appointments: ' . $e->getMessage(),
                'timestamp' => date('c'),
                'duration_ms' => $duration
            ];
        }
    }
    
    /**
     * Get providers (using verified working pattern)
     */
    public function getProviders() {
        $startTime = microtime(true);
        
        try {
            $params = [
                'request' => [
                    'RequestHeader' => $this->createAuthHeader(),
                    'Fields' => null
                ]
            ];
            
            // Log the request attempt
            $this->logRequest('GetProviders', [
                'action' => 'Attempting to get providers list'
            ], false, null, null);
            
            $soapStartTime = microtime(true);
            $response = $this->client->GetProviders($params);
            $soapDuration = (microtime(true) - $soapStartTime) * 1000;
            
            $totalDuration = (microtime(true) - $startTime) * 1000;
            
            // Log success
            $this->logRequest('GetProviders', [
                'action' => 'Successfully retrieved providers list'
            ], true, null, round($totalDuration, 2));
            
            return [
                'success' => true,
                'data' => $response,
                'timestamp' => date('c'),
                'performance' => [
                    'soap_duration_ms' => round($soapDuration, 2),
                    'total_duration_ms' => round($totalDuration, 2)
                ]
            ];
            
        } catch (\SoapFault $e) {
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            $this->logRequest('GetProviders', [
                'action' => 'Attempted to get providers list',
                'error' => $e->getMessage()
            ], false, $e->getMessage(), $duration);
            $this->handleSoapFault($e, 'GetProviders');
        } catch (\Exception $e) {
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            $this->logRequest('GetProviders', [
                'action' => 'Attempted to get providers list',
                'error' => $e->getMessage()
            ], false, $e->getMessage(), $duration);
            return [
                'success' => false,
                'message' => 'Failed to get providers: ' . $e->getMessage(),
                'timestamp' => date('c'),
                'duration_ms' => $duration
            ];
        }
    }
    
    /**
     * Get patients (using EXACT official Tebra example pattern - VERIFIED WORKING)
     */
    public function getPatients($fromDate = null, $toDate = null, $patientId = null, $externalId = null) {
        $startTime = microtime(true);
        $dateFrom = $fromDate ?: '3/4/2012';
        
        try {
            // Use EXACT structure from official Tebra PHP example that works
            $request = array (
                'RequestHeader' => array(
                    'User' => $this->username, 
                    'Password' => $this->password, 
                    'CustomerKey' => $this->customerKey
                ),
                'Filter' => array('FromLastModifiedDate' => $dateFrom),
                'Fields' => array('PatientFullName' => 'true')
            );

            $params = array('request' => $request);
            
            // Log the request attempt
            $this->logRequest('GetPatients', [
                'fromDate' => $dateFrom,
                'action' => 'Attempting to get patients modified after ' . $dateFrom
            ], false, null, null);
            
            $response = $this->client->GetPatients($params)->GetPatientsResult;
            
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            // Log success
            $this->logRequest('GetPatients', [
                'fromDate' => $dateFrom,
                'action' => 'Successfully retrieved patients modified after ' . $dateFrom
            ], true, null, $duration);
            
            return [
                'success' => true,
                'data' => $response,
                'timestamp' => date('c'),
                'duration_ms' => $duration
            ];
            
        } catch (\SoapFault $e) {
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            $this->logRequest('GetPatients', [
                'fromDate' => $dateFrom,
                'action' => 'Attempted to get patients modified after ' . $dateFrom,
                'error' => $e->getMessage()
            ], false, $e->getMessage(), $duration);
            $this->handleSoapFault($e, 'GetPatients');
        } catch (\Exception $e) {
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            $this->logRequest('GetPatients', [
                'fromDate' => $dateFrom,
                'action' => 'Attempted to get patients modified after ' . $dateFrom,
                'error' => $e->getMessage()
            ], false, $e->getMessage(), $duration);
            return [
                'success' => false,
                'message' => 'Failed to get patients: ' . $e->getMessage(),
                'timestamp' => date('c'),
                'duration_ms' => $duration
            ];
        }
    }
    
    /**
     * Get a single patient by ID
     */
    public function getPatient($patientId) {
        $startTime = microtime(true);
        
        try {
            error_log("Getting patient with ID: {$patientId}");
            
            // Use GetPatients with specific patient ID filter
            $request = [
                'request' => [
                    'RequestHeader' => [
                        'User' => $this->username,
                        'Password' => $this->password,
                        'CustomerKey' => $this->customerKey
                    ],
                    'Filter' => [
                        'PatientID' => $patientId,
                        'PatientExternalID' => '',
                        'FromLastModifiedDate' => '',
                        'ToLastModifiedDate' => ''
                    ]
                ]
            ];
            
            $response = $this->client->GetPatients($request);
            $duration = round((microtime(true) - $startTime) * 1000);
            
            // Process response
            if (isset($response->GetPatientsResult)) {
                $result = $response->GetPatientsResult;
                
                // Check security response
                if (isset($result->SecurityResponse) && !$result->SecurityResponse->Authenticated) {
                    throw new \Exception('Authentication failed');
                }
                
                // Check for errors
                if (isset($result->ErrorResponse) && $result->ErrorResponse->IsError) {
                    throw new \Exception('API Error: ' . $result->ErrorResponse->ErrorMessage);
                }
                
                // Extract patient data
                $patient = null;
                if (isset($result->Patients) && isset($result->Patients->PatientData)) {
                    $data = $result->Patients->PatientData;
                    // Should return single patient, but handle array case
                    $patient = is_array($data) ? $data[0] : $data;
                }
                
                $this->logRequest('GetPatient', ['patientId' => $patientId], true, null, $duration);
                
                return [
                    'success' => true,
                    'patient' => $patient,
                    'request_time_ms' => $duration,
                    'timestamp' => date('c')
                ];
            }
            
            throw new \Exception('Unexpected response format from GetPatients');
            
        } catch (\SoapFault $e) {
            $this->handleSoapFault($e, 'GetPatient');
        } catch (\Exception $e) {
            error_log("Failed to get patient: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to get patient: ' . $e->getMessage(),
                'timestamp' => date('c')
            ];
        }
    }
    
    /**
     * Search for patients by last name
     */
    public function searchPatients($lastName) {
        try {
            // Note: This may need to be adjusted based on actual Tebra API
            // The guide doesn't show a specific SearchPatients method
            $params = [
                'request' => [
                    'RequestHeader' => $this->createAuthHeader(),
                    'Filter' => [
                        'LastName' => $lastName
                    ],
                    'Fields' => null
                ]
            ];
            
            $response = $this->client->GetPatients($params);
            
            return [
                'success' => true,
                'data' => $response,
                'timestamp' => date('c')
            ];
            
        } catch (\SoapFault $e) {
            $this->handleSoapFault($e, 'SearchPatients');
        } catch (\Exception $e) {
            error_log("Failed to search patients: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to search patients: ' . $e->getMessage(),
                'timestamp' => date('c')
            ];
        }
    }
    
    /**
     * Get available SOAP methods (for debugging)
     */
    public function getAvailableMethods() {
        try {
            return $this->client->__getFunctions();
        } catch (\Exception $e) {
            throw new \Exception("Error getting available methods: " . $e->getMessage());
        }
    }
    
    /**
     * Get last SOAP request (for debugging)
     */
    public function getLastRequest() {
        return $this->client ? $this->client->__getLastRequest() : null;
    }
    
    /**
     * Get last SOAP response (for debugging)
     */
    public function getLastResponse() {
        return $this->client ? $this->client->__getLastResponse() : null;
    }
    
    /**
     * Create a new appointment
     */
    public function createAppointment($appointmentData) {
        $startTime = microtime(true);
        
        try {
            error_log("Creating appointment with data: " . json_encode($this->redactSensitiveData($appointmentData)));
            
            // Prepare request with authentication headers
            $request = [
                'request' => [
                    'RequestHeader' => [
                        'User' => $this->username,
                        'Password' => $this->password,
                        'CustomerKey' => $this->customerKey
                    ],
                    'Create' => [$appointmentData]
                ]
            ];
            
            $response = $this->client->CreateAppointments($request);
            $duration = round((microtime(true) - $startTime) * 1000);
            
            // Process response
            if (isset($response->CreateAppointmentsResult)) {
                $result = $response->CreateAppointmentsResult;
                
                // Check security response
                if (isset($result->SecurityResponse) && !$result->SecurityResponse->Authenticated) {
                    throw new \Exception('Authentication failed');
                }
                
                // Check for errors
                if (isset($result->ErrorResponse) && $result->ErrorResponse->IsError) {
                    throw new \Exception('API Error: ' . $result->ErrorResponse->ErrorMessage);
                }
                
                // Extract created appointments
                $appointments = [];
                if (isset($result->Appointments) && isset($result->Appointments->AppointmentData)) {
                    $data = $result->Appointments->AppointmentData;
                    $appointments = is_array($data) ? $data : [$data];
                }
                
                $this->logRequest('CreateAppointments', $appointmentData, true, null, $duration);
                
                return [
                    'success' => true,
                    'appointments' => $appointments,
                    'request_time_ms' => $duration,
                    'timestamp' => date('c')
                ];
            }
            
            throw new \Exception('Unexpected response format from CreateAppointments');
            
        } catch (\SoapFault $e) {
            $this->handleSoapFault($e, 'CreateAppointments');
        } catch (\Exception $e) {
            error_log("Failed to create appointment: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to create appointment: ' . $e->getMessage(),
                'timestamp' => date('c')
            ];
        }
    }
    
    /**
     * Update an existing appointment
     */
    public function updateAppointment($appointmentData) {
        $startTime = microtime(true);
        
        try {
            error_log("Updating appointment with data: " . json_encode($this->redactSensitiveData($appointmentData)));
            
            // Prepare request with authentication headers
            $request = [
                'request' => [
                    'RequestHeader' => [
                        'User' => $this->username,
                        'Password' => $this->password,
                        'CustomerKey' => $this->customerKey
                    ],
                    'Update' => [$appointmentData]
                ]
            ];
            
            $response = $this->client->UpdateAppointments($request);
            $duration = round((microtime(true) - $startTime) * 1000);
            
            // Process response
            if (isset($response->UpdateAppointmentsResult)) {
                $result = $response->UpdateAppointmentsResult;
                
                // Check security response
                if (isset($result->SecurityResponse) && !$result->SecurityResponse->Authenticated) {
                    throw new \Exception('Authentication failed');
                }
                
                // Check for errors
                if (isset($result->ErrorResponse) && $result->ErrorResponse->IsError) {
                    throw new \Exception('API Error: ' . $result->ErrorResponse->ErrorMessage);
                }
                
                // Extract updated appointments
                $appointments = [];
                if (isset($result->Appointments) && isset($result->Appointments->AppointmentData)) {
                    $data = $result->Appointments->AppointmentData;
                    $appointments = is_array($data) ? $data : [$data];
                }
                
                $this->logRequest('UpdateAppointments', $appointmentData, true, null, $duration);
                
                return [
                    'success' => true,
                    'appointments' => $appointments,
                    'request_time_ms' => $duration,
                    'timestamp' => date('c')
                ];
            }
            
            throw new \Exception('Unexpected response format from UpdateAppointments');
            
        } catch (\SoapFault $e) {
            $this->handleSoapFault($e, 'UpdateAppointments');
        } catch (\Exception $e) {
            error_log("Failed to update appointment: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update appointment: ' . $e->getMessage(),
                'timestamp' => date('c')
            ];
        }
    }
    
    /**
     * Generic SOAP method caller - handles any SOAP operation
     * This method was missing and causing the fatal error in Cloud Run
     */
    public function callSoapMethod($method, $params = []) {
        $startTime = microtime(true);
        error_log("Starting {$method} SOAP request");
        
        try {
            // Ensure SOAP client is initialized
            if (!$this->client) {
                throw new \Exception("SOAP client not initialized");
            }
            
            // Build request with authentication header
            $request = [
                'request' => array_merge(
                    ['RequestHeader' => $this->createAuthHeader()],
                    $params
                )
            ];
            
            // Call the SOAP method dynamically
            $soapStartTime = microtime(true);
            $response = $this->client->__soapCall($method, [$request]);
            $soapDuration = (microtime(true) - $soapStartTime) * 1000;
            
            error_log("SOAP {$method} took: " . round($soapDuration, 2) . "ms");
            
            // Extract the result based on the method name
            $resultProperty = $method . 'Result';
            $result = isset($response->$resultProperty) ? $response->$resultProperty : $response;
            
            // Check for API errors in the response
            if (isset($result->ErrorResponse) && $result->ErrorResponse->IsError) {
                throw new \Exception('Tebra API Error: ' . $result->ErrorResponse->ErrorMessage);
            }
            
            $totalDuration = (microtime(true) - $startTime) * 1000;
            error_log("Total {$method} request took: " . round($totalDuration, 2) . "ms");
            
            return [
                'success' => true,
                'data' => $result,
                'timestamp' => date('c'),
                'performance' => [
                    'soap_duration_ms' => round($soapDuration, 2),
                    'total_duration_ms' => round($totalDuration, 2)
                ]
            ];
            
        } catch (\SoapFault $e) {
            error_log("SOAP Fault in {$method}: " . $e->getMessage());
            if ($this->client) {
                error_log("Last SOAP Request: " . $this->client->__getLastRequest());
                error_log("Last SOAP Response: " . $this->client->__getLastResponse());
            }
            return [
                'success' => false,
                'error' => 'SOAP Fault: ' . $e->getMessage(),
                'faultcode' => $e->faultcode ?? 'Unknown',
                'timestamp' => date('c')
            ];
        } catch (\Exception $e) {
            error_log("Error in {$method}: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => date('c')
            ];
        }
    }
}

?>