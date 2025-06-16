<?php

/**
 * Start with working GetPatients and make incremental changes
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "=== Incremental Testing Starting from Working GetPatients ===\n\n";

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
    
    // Helper function
    function testCall($client, $description, $method, $params) {
        echo "Testing: $description\n";
        echo "Method: $method\n";
        echo "Params: " . json_encode($params, JSON_PRETTY_PRINT) . "\n";
        
        // Rate limiting
        sleep(2);
        
        try {
            $startTime = microtime(true);
            $response = $client->$method($params);
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            echo "✓ SUCCESS (took {$duration}ms)\n";
            
            // Check for errors
            $resultProperty = $method . 'Result';
            if (isset($response->$resultProperty->ErrorResponse->IsError) && $response->$resultProperty->ErrorResponse->IsError) {
                echo "  API Error: " . $response->$resultProperty->ErrorResponse->ErrorMessage . "\n";
                return false;
            } else {
                echo "  No errors - endpoint working!\n";
                return true;
            }
            
        } catch (Exception $e) {
            echo "✗ FAILED: " . $e->getMessage() . "\n";
            return false;
        }
    }
    
    // Test 1: Baseline - Known working GetPatients
    echo "1. BASELINE - Known working GetPatients\n";
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
    
    $success = testCall($client, 'Known working GetPatients', 'GetPatients', $params);
    if (!$success) {
        die("ERROR: Known working baseline failed! Something is wrong.\n");
    }
    
    echo "\n" . str_repeat("=", 80) . "\n\n";
    
    // Test 2: Try GetProviders (minimal request)
    echo "2. MODIFICATION - Try GetProviders (minimal request)\n";
    $request = array(
        'RequestHeader' => array(
            'User' => $username,
            'Password' => $password,
            'CustomerKey' => $customerKey
        )
    );
    $params = array('request' => $request);
    
    testCall($client, 'GetProviders with minimal request', 'GetProviders', $params);
    
    echo "\n" . str_repeat("=", 80) . "\n\n";
    
    // Test 3: Try GetPractices (minimal request)
    echo "3. MODIFICATION - Try GetPractices (minimal request)\n";
    $request = array(
        'RequestHeader' => array(
            'User' => $username,
            'Password' => $password,
            'CustomerKey' => $customerKey
        )
    );
    $params = array('request' => $request);
    
    testCall($client, 'GetPractices with minimal request', 'GetPractices', $params);
    
    echo "\n" . str_repeat("=", 80) . "\n\n";
    
    // Test 4: Try GetAppointments with MINIMAL parameters (just like GetProviders)
    echo "4. MODIFICATION - Try GetAppointments with MINIMAL parameters\n";
    $request = array(
        'RequestHeader' => array(
            'User' => $username,
            'Password' => $password,
            'CustomerKey' => $customerKey
        )
        // NO other parameters - see if it works at all
    );
    $params = array('request' => $request);
    
    testCall($client, 'GetAppointments with minimal request (no dates)', 'GetAppointments', $params);
    
    echo "\n" . str_repeat("=", 80) . "\n\n";
    
    // Test 5: Add just PracticeName to GetAppointments
    echo "5. MODIFICATION - Add PracticeName to GetAppointments\n";
    $request = array(
        'RequestHeader' => array(
            'User' => $username,
            'Password' => $password,
            'CustomerKey' => $customerKey
        ),
        'PracticeName' => 'Lukner Clinic'
    );
    $params = array('request' => $request);
    
    testCall($client, 'GetAppointments with just PracticeName', 'GetAppointments', $params);
    
    echo "\n" . str_repeat("=", 80) . "\n\n";
    
    echo "=== Testing complete ===\n";
    echo "This will help us understand exactly where GetAppointments breaks!\n";
    
} catch (Exception $e) {
    echo "Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}
?>