<?php

/**
 * Tebra API Client for PHP
 * Handles SOAP communication with Tebra/Kareo API
 */
class TebraApiClient {
    private $wsdlUrl;
    private $username;
    private $password;
    private $customerKey;
    private $practiceId;
    private $soapClient;
    
    public function __construct($wsdlUrl, $username, $password, $customerKey = null, $practiceId = null) {
        $this->wsdlUrl = $wsdlUrl;
        $this->username = $username;
        $this->password = $password;
        $this->customerKey = $customerKey;
        $this->practiceId = $practiceId;
        
        $this->initializeSoapClient();
    }
    
    /**
     * Initialize SOAP client with proper configuration
     */
    private function initializeSoapClient(): void {
        try {
            $options = [
                'login' => $this->username,
                'password' => $this->password,
                'soap_version' => SOAP_1_2,
                'trace' => true,
                'exceptions' => true,
                'cache_wsdl' => WSDL_CACHE_NONE,
                'connection_timeout' => 60,
                'user_agent' => 'TebraApiClient/1.0',
                'features' => SOAP_SINGLE_ELEMENT_ARRAYS,
                'stream_context' => stream_context_create([
                    'http' => [
                        'timeout' => 60,
                        'user_agent' => 'TebraApiClient/1.0',
                        'method' => 'GET'
                    ],
                    'ssl' => [
                        'verify_peer' => true,
                        'verify_peer_name' => true,
                        'allow_self_signed' => false
                    ]
                ])
            ];
            
            $this->soapClient = new SoapClient($this->wsdlUrl, $options);
            error_log("Tebra SOAP client initialized successfully");
            
        } catch (Exception $e) {
            error_log("Failed to initialize Tebra SOAP client: " . $e->getMessage());
            throw new Exception("Failed to initialize Tebra SOAP client: " . $e->getMessage());
        }
    }
    
    /**
     * Test the API connection
     */
    public function testConnection(): array {
        try {
            // Try a simple operation to test the connection
            $response = $this->soapClient->__call('TestConnection', []);
            error_log("Tebra connection test successful");
            return [
                'success' => true,
                'message' => 'Connection test successful',
                'timestamp' => date('c')
            ];
        } catch (Exception $e) {
            error_log("Tebra connection test failed: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Connection test failed: ' . $e->getMessage(),
                'timestamp' => date('c')
            ];
        }
    }
    
    /**
     * Convert YYYY-MM-DD (clinic local date) to ISO-8601 UTC format required by Tebra.
     */
    private function formatTebraDate(string $date): string {
        try {
            // Clinic operates in America/Chicago; convert start-of-day to UTC
            $dt = new DateTime($date, new DateTimeZone('America/Chicago'));
            $dt->setTime(0, 0, 0);
            $dt->setTimezone(new DateTimeZone('UTC'));
            return $dt->format('Y-m-d\TH:i:s\Z');
        } catch (Exception $e) {
            throw new InvalidArgumentException("Invalid date format provided to getAppointments: {$date}");
        }
    }
    
    /**
     * Get appointments for a date range
     */
    public function getAppointments($fromDate, $toDate): array {
        $fromDateIso = $this->formatTebraDate($fromDate);
        $toDateIso   = $this->formatTebraDate($toDate);
        
        try {
            $params = [
                'request' => [
                    'RequestHeader' => [
                        'User' => $this->username,
                        'Password' => $this->password,
                        'CustomerKey' => $this->customerKey
                    ],
                    'PracticeID' => $this->practiceId ?: 67149,  // CRITICAL: Practice ID required for appointment queries
                    'FromDate' => $fromDateIso,
                    'ToDate' => $toDateIso
                ]
            ];
            
            $response = $this->soapClient->__call('GetAppointments', [$params]);
            
            return [
                'success' => true,
                'data' => $response,
                'timestamp' => date('c')
            ];
            
        } catch (Exception $e) {
            error_log("Failed to get appointments: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to get appointments: ' . $e->getMessage(),
                'timestamp' => date('c')
            ];
        }
    }
    
    /**
     * Get providers
     */
    public function getProviders(): array {
        try {
            $params = [
                'request' => [
                    'RequestHeader' => [
                        'User' => $this->username,
                        'Password' => $this->password,
                        'CustomerKey' => $this->customerKey
                    ]
                ]
            ];
            
            $response = $this->soapClient->__call('GetProviders', $params);
            
            return [
                'success' => true,
                'data' => $response,
                'timestamp' => date('c')
            ];
            
        } catch (Exception $e) {
            error_log("Failed to get providers: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to get providers: ' . $e->getMessage(),
                'timestamp' => date('c')
            ];
        }
    }
    
    /**
     * Search for patients
     */
    public function searchPatients($lastName): array {
        try {
            $params = [
                'request' => [
                    'CustomerKey' => $this->customerKey,
                    'LastName' => $lastName
                ]
            ];
            
            $response = $this->soapClient->__call('SearchPatients', $params);
            
            return [
                'success' => true,
                'data' => $response,
                'timestamp' => date('c')
            ];
            
        } catch (Exception $e) {
            error_log("Failed to search patients: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to search patients: ' . $e->getMessage(),
                'timestamp' => date('c')
            ];
        }
    }
    
    /**
     * Get patient by ID
     */
    public function getPatientById($patientId): array {
        try {
            $params = [
                'request' => [
                    'CustomerKey' => $this->customerKey,
                    'PatientID' => $patientId
                ]
            ];
            
            $response = $this->soapClient->__call('GetPatient', $params);
            
            return [
                'success' => true,
                'data' => $response,
                'timestamp' => date('c')
            ];
            
        } catch (Exception $e) {
            error_log("Failed to get patient: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to get patient: ' . $e->getMessage(),
                'timestamp' => date('c')
            ];
        }
    }
    
    /**
     * Get SOAP client last request for debugging
     */
    public function getLastRequest(): string {
        return $this->soapClient->__getLastRequest();
    }
    
    /**
     * Get SOAP client last response for debugging
     */
    public function getLastResponse(): string {
        return $this->soapClient->__getLastResponse();
    }
}

?>