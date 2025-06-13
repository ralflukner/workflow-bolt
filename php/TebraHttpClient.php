<?php

/**
 * Tebra HTTP Client for PHP
 * Uses cURL to make direct HTTP requests to Tebra API
 */
class TebraHttpClient {
    private $baseUrl;
    private $username;
    private $password;
    private $customerKey;
    
    public function __construct($baseUrl, $username, $password, $customerKey = null) {
        // Convert WSDL URL to base service URL and clean up parameters
        $this->baseUrl = preg_replace('/\?.*$/', '', $baseUrl);
        $this->username = $username;
        $this->password = $password;
        $this->customerKey = $customerKey;
    }
    
    /**
     * Make a SOAP request using cURL
     */
    private function makeSOAPRequest($action, $soapBody) {
        $ch = curl_init();
        
        // Build SOAP envelope
        $soapEnvelope = '<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:kar="http://www.kareo.com/api/schemas/">
    <soap:Header/>
    <soap:Body>
        ' . $soapBody . '
    </soap:Body>
</soap:Envelope>';
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->baseUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $soapEnvelope,
            CURLOPT_HTTPHEADER => [
                'Content-Type: text/xml; charset=utf-8',
                'SOAPAction: "http://www.kareo.com/api/schemas/KareoServices/' . $action . '"',
                'Content-Length: ' . strlen($soapEnvelope)
            ],
            CURLOPT_USERPWD => $this->username . ':' . $this->password,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_VERBOSE => true
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);
        
        if ($error) {
            throw new Exception("cURL error: $error");
        }
        
        if ($httpCode >= 400) {
            throw new Exception("HTTP error $httpCode: $response");
        }
        
        return $response;
    }
    
    /**
     * Test the API connection
     */
    public function testConnection() {
        try {
            // Try to get providers as a connection test
            $soapBody = '<kar:GetProviders>
                <kar:request>
                    <kar:CustomerKey>' . htmlspecialchars($this->customerKey) . '</kar:CustomerKey>
                </kar:request>
            </kar:GetProviders>';
            
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
                    <kar:CustomerKey>' . htmlspecialchars($this->customerKey) . '</kar:CustomerKey>
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
            $soapBody = '<kar:GetProviders>
                <kar:request>
                    <kar:CustomerKey>' . htmlspecialchars($this->customerKey) . '</kar:CustomerKey>
                </kar:request>
            </kar:GetProviders>';
            
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
                    <kar:CustomerKey>' . htmlspecialchars($this->customerKey) . '</kar:CustomerKey>
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