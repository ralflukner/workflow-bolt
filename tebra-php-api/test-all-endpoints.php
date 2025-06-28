<?php

/**
 * Test all available Tebra SOAP endpoints to see what's working
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "=== Testing All Tebra SOAP Endpoints ===\n\n";

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
    
    // Show available functions
    echo "Available SOAP functions:\n";
    $functions = $client->__getFunctions();
    foreach ($functions as $function) {
        echo "  - $function\n";
    }
    echo "\n" . str_repeat("=", 80) . "\n\n";
    
    // Helper function to create basic request header
    function createRequestHeader($username, $password, $customerKey) {
        return array(
            'RequestHeader' => array(
                'User' => $username,
                'Password' => $password,
                'CustomerKey' => $customerKey
            )
        );
    }
    
    // Helper function to test an endpoint with rate limiting
    function testEndpoint($client, $endpointName, $params, $description = '') {
        echo "Testing: $endpointName" . ($description ? " - $description" : "") . "\n";
        $safe = $params;
$safe['request']['RequestHeader']['Password']   = '***';
$safe['request']['RequestHeader']['CustomerKey'] = '***';
echo "Parameters: " . json_encode($safe, JSON_PRETTY_PRINT) . "\n";
        
        // Rate limiting: 2 second delay between requests
        echo "  [Rate limiting: waiting 2 seconds...]\n";
        sleep(2);
        
        try {
            $startTime = microtime(true);
            $response = $client->$endpointName($params);
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            echo "✓ SUCCESS (took {$duration}ms)\n";
            
            // Check for common error patterns
            $resultProperty = $endpointName . 'Result';
            if (isset($response->$resultProperty->ErrorResponse->IsError) && $response->$resultProperty->ErrorResponse->IsError) {
                echo "  API Error: " . $response->$resultProperty->ErrorResponse->ErrorMessage . "\n";
            } else {
                echo "  No errors - endpoint working\n";
                // Show some structure info
                if (isset($response->$resultProperty)) {
                    $result = $response->$resultProperty;
                    $properties = get_object_vars($result);
                    echo "  Response properties: " . implode(', ', array_keys($properties)) . "\n";
                }
            }
            
            return true;
        } catch (Exception $e) {
            echo "✗ FAILED: " . $e->getMessage() . "\n";
            return false;
        }
    }
    
    // Test essential endpoints only (rate-limited)
    $testCount = 0;
    $maxTests = 5; // Limit to 5 tests total
    
    // Test 1: GetPatients (known working)
    if (++$testCount <= $maxTests) {
        echo "1. GetPatients (known working)\n";
        $params = array_merge(
            createRequestHeader($username, $password, $customerKey),
            array(
                'Filter' => array('FromLastModifiedDate' => '3/4/2012'),
                'Fields' => array('PatientFullName' => 'true')
            )
        );
        testEndpoint($client, 'GetPatients', array('request' => $params));
        echo "\n" . str_repeat("-", 60) . "\n\n";
    }
    
    // Test 2: GetProviders
    if (++$testCount <= $maxTests) {
        echo "2. GetProviders\n";
        $params = createRequestHeader($username, $password, $customerKey);
        testEndpoint($client, 'GetProviders', array('request' => $params));
        echo "\n" . str_repeat("-", 60) . "\n\n";
    }
    
    // Test 3: GetPractices  
    if (++$testCount <= $maxTests) {
        echo "3. GetPractices\n";
        $params = createRequestHeader($username, $password, $customerKey);
        testEndpoint($client, 'GetPractices', array('request' => $params));
        echo "\n" . str_repeat("-", 60) . "\n\n";
    }
    
    // Test 4: GetServiceLocations
    if (++$testCount <= $maxTests) {
        echo "4. GetServiceLocations\n";
        $params = createRequestHeader($username, $password, $customerKey);
        testEndpoint($client, 'GetServiceLocations', array('request' => $params));
        echo "\n" . str_repeat("-", 60) . "\n\n";
    }
    
    // Test 5: GetAppointments (the problematic one)
    if (++$testCount <= $maxTests) {
        echo "5. GetAppointments (known failing)\n";
        $params = array_merge(
            createRequestHeader($username, $password, $customerKey),
            array(
                'PracticeName' => 'Lukner Clinic',
                'StartDate' => '6/15/2025',
                'EndDate' => '6/15/2025'
            )
        );
        testEndpoint($client, 'GetAppointments', array('request' => $params));
        echo "\n" . str_repeat("-", 60) . "\n\n";
    }
    
} catch (Exception $e) {
    echo "Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n=== Testing complete ===\n";