<?php

declare(strict_types=1);

namespace LuknerLumina\TebraApi;

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
    private $version;
    
    public function __construct() {
        // Read from environment variables
        $this->username = $this->getRequiredEnv('TEBRA_USERNAME');
        $this->password = $this->getRequiredEnv('TEBRA_PASSWORD');
        $this->customerKey = $this->getRequiredEnv('TEBRA_CUSTOMER_KEY');
        // Use the working WSDL URL regardless of environment variable
        $this->wsdlUrl = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';
        $this->version = 'v2'; // Default version as per guide
        
        $this->initializeClient();
    }
    
    private function getRequiredEnv($key) {
        $value = getenv($key);
        if ($value === false) {
            throw new \RuntimeException("Required environment variable {$key} is not set");
        }
        return $value;
    }
    
    /**
     * Initialize SOAP client with proper configuration (from official guide)
     */
    private function initializeClient() {
        $options = [
            'soap_version' => SOAP_1_1,
            'trace' => true,
            'exceptions' => true,
            'cache_wsdl' => WSDL_CACHE_NONE,
            'features' => SOAP_SINGLE_ELEMENT_ARRAYS,
            'user_agent' => 'TebraSOAP-PHP-Client/1.0',
            'connection_timeout' => 30,
            'stream_context' => stream_context_create([
                'ssl' => [
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                    'allow_self_signed' => false
                ]
            ])
        ];
        
        try {
            $this->client = new \SoapClient($this->wsdlUrl, $options);
            error_log("Tebra SOAP client initialized successfully with WSDL: " . $this->wsdlUrl);
        } catch (\SoapFault $e) {
            error_log("SOAP Client initialization failed: " . $e->getMessage());
            throw new \Exception("SOAP Client initialization failed: " . $e->getMessage());
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
     * Handle SOAP faults and errors (from official guide)
     */
    private function handleSoapFault($e, $method) {
        error_log("SOAP Error in {$method}: " . $e->getMessage());
        if ($this->client) {
            error_log("Last SOAP Request: " . $this->client->__getLastRequest());
            error_log("Last SOAP Response: " . $this->client->__getLastResponse());
        }
        throw new \Exception("SOAP Error in {$method}: " . $e->getMessage());
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
     * Get appointments for a date range (using verified working pattern)
     */
    public function getAppointments($fromDate, $toDate) {
        try {
            $params = [
                'request' => [
                    'RequestHeader' => $this->createAuthHeader(),
                    'FromDate' => $fromDate,
                    'ToDate' => $toDate,
                    'Fields' => null
                ]
            ];
            
            $response = $this->client->GetAppointments($params);
            
            return [
                'success' => true,
                'data' => $response,
                'timestamp' => date('c')
            ];
            
        } catch (\SoapFault $e) {
            $this->handleSoapFault($e, 'GetAppointments');
        } catch (\Exception $e) {
            error_log("Failed to get appointments: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to get appointments: ' . $e->getMessage(),
                'timestamp' => date('c')
            ];
        }
    }
    
    /**
     * Get providers (using verified working pattern)
     */
    public function getProviders() {
        try {
            $params = [
                'request' => [
                    'RequestHeader' => $this->createAuthHeader(),
                    'Fields' => null
                ]
            ];
            
            $response = $this->client->GetProviders($params);
            
            return [
                'success' => true,
                'data' => $response,
                'timestamp' => date('c')
            ];
            
        } catch (\SoapFault $e) {
            $this->handleSoapFault($e, 'GetProviders');
        } catch (\Exception $e) {
            error_log("Failed to get providers: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to get providers: ' . $e->getMessage(),
                'timestamp' => date('c')
            ];
        }
    }
    
    /**
     * Get patients (using EXACT official Tebra example pattern - VERIFIED WORKING)
     */
    public function getPatients($fromDate = null, $toDate = null, $patientId = null, $externalId = null) {
        try {
            // Use EXACT structure from official Tebra PHP example that works
            $request = array (
                'RequestHeader' => array(
                    'User' => $this->username, 
                    'Password' => $this->password, 
                    'CustomerKey' => $this->customerKey
                ),
                'Filter' => array('FromLastModifiedDate' => $fromDate ?: '3/4/2012'),
                'Fields' => array('PatientFullName' => 'true')
            );

            $params = array('request' => $request);
            $response = $this->client->GetPatients($params)->GetPatientsResult;
            
            return [
                'success' => true,
                'data' => $response,
                'timestamp' => date('c')
            ];
            
        } catch (\SoapFault $e) {
            $this->handleSoapFault($e, 'GetPatients');
        } catch (\Exception $e) {
            error_log("Failed to get patients: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to get patients: ' . $e->getMessage(),
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
                'request' => array_merge($this->createAuthHeader(), [
                    'LastName' => $lastName
                ])
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
}

?>