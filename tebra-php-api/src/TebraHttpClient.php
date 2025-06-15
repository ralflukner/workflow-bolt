<?php

declare(strict_types=1);

namespace LuknerLumina\TebraApi;

/**
 * Tebra HTTP Client for PHP
 * Uses cURL to make direct HTTP requests to Tebra API
 */
class TebraHttpClient {
    private $wsdlUrl;
    private $username;
    private $password;
    private $customerKey;
    private $soapClient;
    
    public function __construct() {
        // Read from environment variables
        $this->wsdlUrl = $this->getRequiredEnv('TEBRA_WSDL_URL');
        $this->username = $this->getRequiredEnv('TEBRA_USERNAME');
        $this->password = $this->getRequiredEnv('TEBRA_PASSWORD');
        $this->customerKey = $this->getRequiredEnv('TEBRA_CUSTOMER_KEY');
        
        // Initialize SOAP client (existing code remains unchanged)
        // SOAP client initialized on demand
    }
    
    private function getRequiredEnv($key) {
        $value = getenv($key);
        if ($value === false) {
            throw new \RuntimeException("Required environment variable {$key} is not set");
        }
        return $value;
    }
    
    /**
     * Make a SOAP request using cURL
     */
    private function makeSOAPRequest($action, $soapBody) {
        $ch = curl_init();
        
        // Create temporary stream for verbose output
        $verbose = fopen('php://temp', 'w+');
        
        // Build SOAP envelope with proper RequestHeader
        $soapEnvelope = '<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:kar="http://www.kareo.com/ServiceContracts/2.1">
    <soap:Header>
        <kar:RequestHeader>
            <kar:CustomerKey>' . htmlspecialchars($this->customerKey) . '</kar:CustomerKey>
            <kar:User>' . htmlspecialchars($this->username) . '</kar:User>
            <kar:Password>' . htmlspecialchars($this->password) . '</kar:Password>
        </kar:RequestHeader>
    </soap:Header>
    <soap:Body>
        ' . $soapBody . '
    </soap:Body>
</soap:Envelope>';
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->wsdlUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $soapEnvelope,
            CURLOPT_HTTPHEADER => [
                'Content-Type: text/xml; charset=utf-8',
                'SOAPAction: "http://www.kareo.com/ServiceContracts/2.1/' . $action . '"',
                'Content-Length: ' . strlen($soapEnvelope)
            ],
            CURLOPT_TIMEOUT => 60,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_VERBOSE => true,
            CURLOPT_STDERR => $verbose
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        // Read and scrub verbose output
        rewind($verbose);
        $verboseLog = stream_get_contents($verbose);
        fclose($verbose);
        
        // Scrub sensitive information from verbose log
        $verboseLog = preg_replace('/Authorization: Basic [^\r\n]+/', 'Authorization: Basic [REDACTED]', $verboseLog);
        $verboseLog = preg_replace('/User: [^\r\n]+/', 'User: [REDACTED]', $verboseLog);
        $verboseLog = preg_replace('/Pass: [^\r\n]+/', 'Pass: [REDACTED]', $verboseLog);
        
        // Log scrubbed verbose output if needed
        if ($error || $httpCode >= 400) {
            error_log("Tebra API request failed. Verbose log: " . $verboseLog);
        }
        
        curl_close($ch);
        
        if ($error) {
            throw new Exception("cURL error: $error");
        }
        
        if ($httpCode >= 400) {
            throw new \Exception("HTTP error $httpCode: $response");
        }
        
        return $response;
    }
    
    /**
     * Test the API connection
     */
    public function testConnection() {
        try {
            // Try to get providers as a connection test
            $soapBody = '<kar:GetProviders />';
            
            $response = $this->makeSOAPRequest('GetProviders', $soapBody);
            
            error_log("Tebra HTTP connection test successful");
            return [
                'success' => true,
                'message' => 'Connection test successful',
                'response' => $response,
                'timestamp' => date('c')
            ];
            
        } catch (Exception $e) {
            error_log("Tebra HTTP connection test failed: " . $e->getMessage());
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
    public function getAppointments($fromDate, $toDate) {
        try {
            $soapBody = '<kar:GetAppointments>
                <kar:request>
                    <kar:FromDate>' . htmlspecialchars($fromDate) . '</kar:FromDate>
                    <kar:ToDate>' . htmlspecialchars($toDate) . '</kar:ToDate>
                </kar:request>
            </kar:GetAppointments>';
            
            $response = $this->makeSOAPRequest('GetAppointments', $soapBody);
            
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
    public function getProviders() {
        try {
            $soapBody = '<kar:GetProviders />';
            
            $response = $this->makeSOAPRequest('GetProviders', $soapBody);
            
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
    public function searchPatients($lastName) {
        try {
            $soapBody = '<kar:SearchPatients>
                <kar:request>
                    <kar:LastName>' . htmlspecialchars($lastName) . '</kar:LastName>
                </kar:request>
            </kar:SearchPatients>';
            
            $response = $this->makeSOAPRequest('SearchPatients', $soapBody);
            
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
}

?>