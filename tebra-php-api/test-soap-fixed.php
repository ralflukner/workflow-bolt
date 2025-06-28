<?php

/**
 * Test Tebra SOAP with proper parameter structure
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "=== Testing Tebra SOAP with Proper Parameter Structure ===\n\n";

/**
 * Safely logs SOAP XML by obfuscating sensitive authentication data
 * @param string $xml Raw XML string (SOAP request or response)
 * @param string $type Type of XML (request/response) for logging
 * @return void
 */
function logSoapSafely($xml, $type = 'SOAP') {
    if (empty($xml)) {
        echo "[$type] No content to display\n";
        return;
    }
    
    try {
        // Parse XML to sanitize sensitive data
        $dom = new DOMDocument();
        $dom->preserveWhiteSpace = false;
        $dom->formatOutput = true;
        
        if (!$dom->loadXML($xml)) {
            echo "[$type] Failed to parse XML - skipping for security\n";
            return;
        }
        
        // Create XPath for finding sensitive elements
        $xpath = new DOMXPath($dom);
        
        // Obfuscate sensitive authentication elements
        $sensitiveElements = [
            '//User',
            '//Password', 
            '//CustomerKey',
            '//user',
            '//password',
            '//customerKey',
            '//customerkey',
            '//*[local-name()="User"]',
            '//*[local-name()="Password"]',
            '//*[local-name()="CustomerKey"]'
        ];
        
        foreach ($sensitiveElements as $element) {
            $nodes = $xpath->query($element);
            foreach ($nodes as $node) {
                $node->nodeValue = '***REDACTED***';
            }
        }
        
        // Also sanitize HTTP Authorization headers if present
        $sanitizedXml = $dom->saveXML();
        $sanitizedXml = preg_replace('/Authorization:\s*Basic\s+[A-Za-z0-9+\/=]+/i', 'Authorization: Basic ***REDACTED***', $sanitizedXml);
        
        echo "[$type] Sanitized XML:\n" . $sanitizedXml . "\n";
        
    } catch (Exception $e) {
        echo "[$type] Error sanitizing XML: " . $e->getMessage() . " - skipping for security\n";
    }
}

// Get credentials from environment
$username = $_ENV['TEBRA_USERNAME'] ?? getenv('TEBRA_USERNAME');
$password = $_ENV['TEBRA_PASSWORD'] ?? getenv('TEBRA_PASSWORD'); 
$customerKey = $_ENV['TEBRA_CUSTOMER_KEY'] ?? getenv('TEBRA_CUSTOMER_KEY');
$wsdlUrl = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';

if (!$username || !$password || !$customerKey) {
    die("Missing Tebra credentials in environment variables\n");
}

try {
    // Create SOAP client
    $options = array(
        'soap_version' => SOAP_1_1,
        'trace' => true,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE
    );
    
    $client = new SoapClient($wsdlUrl, $options);
    echo "✓ SOAP client created successfully\n\n";
    
    // Test 1: GetPatients with proper request structure
    echo "Test 1: GetPatients with proper request parameter\n";
    
    $request = array(
        'RequestHeader' => array(
            'User' => $username,
            'Password' => $password,
            'CustomerKey' => $customerKey
        ),
        'Filter' => array(
            'FromLastModifiedDate' => '3/4/2012'
        ),
        'Fields' => array(
            'PatientFullName' => 'true'
        )
    );
    
    $params = array('request' => $request);
    
    echo "Request structure:\n";
    print_r($params);
    echo "\n";
    
    try {
        $response = $client->GetPatients($params);
        echo "✓ GetPatients Success! Response structure:\n";
        if (isset($response->GetPatientsResult->ErrorResponse->IsError) && $response->GetPatientsResult->ErrorResponse->IsError) {
            echo "Error: " . $response->GetPatientsResult->ErrorResponse->ErrorMessage . "\n";
        } else {
            echo "Success - no errors in GetPatients\n";
        }
    } catch (Exception $e) {
        echo "✗ GetPatients Error: " . $e->getMessage() . "\n";
        logSoapSafely($client->__getLastRequest(), 'SOAP Request');
        logSoapSafely($client->__getLastResponse(), 'SOAP Response');
    }
    
    echo "\n" . str_repeat("=", 60) . "\n\n";
    
    // Test 2: GetAppointments with proper request structure
    echo "Test 2: GetAppointments with proper request parameter\n";
    
    $request = array(
        'RequestHeader' => array(
            'User' => $username,
            'Password' => $password,
            'CustomerKey' => $customerKey
        ),
        'PracticeName' => 'Lukner Clinic',
        'StartDate' => '6/15/2025',
        'EndDate' => '6/15/2025'
    );
    
    $params = array('request' => $request);
    
    echo "Request structure:\n";
    print_r($params);
    echo "\n";
    
    try {
        $response = $client->GetAppointments($params);
        echo "✓ GetAppointments Success! Response:\n";
        print_r($response);
    } catch (Exception $e) {
        echo "✗ GetAppointments Error: " . $e->getMessage() . "\n";
        logSoapSafely($client->__getLastRequest(), 'SOAP Request');
        logSoapSafely($client->__getLastResponse(), 'SOAP Response');
    }
    
} catch (Exception $e) {
    echo "Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n=== Testing complete ===\n";