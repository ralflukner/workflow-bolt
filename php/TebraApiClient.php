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
    private $soapClient;
    
    public function __construct($wsdlUrl, $username, $password, $customerKey = null) {
        $this->wsdlUrl = $wsdlUrl;
        $this->username = $username;
        $this->password = $password;
        $this->customerKey = $customerKey;
        
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
                        'verify_peer' => false,
                        'verify_peer_name' => false,
                        'allow_self_signed' => true
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
     * Get appointments for a date range
     */
    public function getAppointments($fromDate, $toDate): array {
        try {
            $params = [
                'request' => [
                    'CustomerKey' => $this->customerKey,
                    'FromDate' => $fromDate,
                    'ToDate' => $toDate
                ]
            ];
            
            $response = $this->soapClient->__call('GetAppointments', $params);
            
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
                    'CustomerKey' => $this->customerKey
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