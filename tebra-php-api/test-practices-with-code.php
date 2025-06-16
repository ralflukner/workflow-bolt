<?php

/**
 * Test GetPractices with specific practice code 67149
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "=== Testing GetPractices with Practice Code 67149 ===\n\n";

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
    function testPracticesCall($client, $description, $request) {
        echo "Testing: $description\n";
        echo "Request: " . json_encode($request, JSON_PRETTY_PRINT) . "\n";
        
        // Rate limiting
        sleep(2);
        
        try {
            $startTime = microtime(true);
            $response = $client->GetPractices(array('request' => $request));
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            echo "✓ SUCCESS (took {$duration}ms)\n";
            
            if (isset($response->GetPracticesResult->ErrorResponse->IsError) && $response->GetPracticesResult->ErrorResponse->IsError) {
                $error = $response->GetPracticesResult->ErrorResponse->ErrorMessage;
                echo "  API Error: $error\n";
                return false;
            } else {
                echo "  ✅ No errors - GetPractices working!\n";
                
                // Show some data if available
                if (isset($response->GetPracticesResult->Practices)) {
                    $practices = $response->GetPracticesResult->Practices;
                    if (is_array($practices)) {
                        echo "  Found " . count($practices) . " practices\n";
                    } else if (is_object($practices)) {
                        echo "  Found 1 practice\n";
                        if (isset($practices->PracticeName)) {
                            echo "  Practice Name: " . $practices->PracticeName . "\n";
                        }
                        if (isset($practices->PracticeID)) {
                            echo "  Practice ID: " . $practices->PracticeID . "\n";
                        }
                    }
                } else {
                    echo "  No practices data in response\n";
                }
                
                return true;
            }
            
        } catch (Exception $e) {
            echo "✗ FAILED: " . $e->getMessage() . "\n";
            return false;
        }
    }
    
    // Base request
    $baseRequest = array(
        'RequestHeader' => array(
            'User' => $username,
            'Password' => $password,
            'CustomerKey' => $customerKey
        )
    );
    
    // Test 1: Minimal request (we know this fails)
    echo "1. Baseline - Minimal GetPractices (known to fail)\n";
    testPracticesCall($client, 'Minimal request', $baseRequest);
    
    echo "\n" . str_repeat("=", 60) . "\n\n";
    
    // Test 2: With PracticeID
    echo "2. GetPractices with PracticeID = 67149\n";
    $requestWithID = array_merge($baseRequest, array(
        'PracticeID' => '67149'
    ));
    testPracticesCall($client, 'With PracticeID 67149', $requestWithID);
    
    echo "\n" . str_repeat("=", 60) . "\n\n";
    
    // Test 3: With PracticeName
    echo "3. GetPractices with PracticeName = 'Lukner Clinic'\n";
    $requestWithName = array_merge($baseRequest, array(
        'PracticeName' => 'Lukner Clinic'
    ));
    testPracticesCall($client, 'With PracticeName', $requestWithName);
    
    echo "\n" . str_repeat("=", 60) . "\n\n";
    
    // Test 4: With both PracticeID and PracticeName
    echo "4. GetPractices with both ID and Name\n";
    $requestWithBoth = array_merge($baseRequest, array(
        'PracticeID' => '67149',
        'PracticeName' => 'Lukner Clinic'
    ));
    testPracticesCall($client, 'With both ID and Name', $requestWithBoth);
    
    echo "\n" . str_repeat("=", 60) . "\n\n";
    
    // Test 5: Try with Filter (like GetPatients uses)
    echo "5. GetPractices with Filter structure\n";
    $requestWithFilter = array_merge($baseRequest, array(
        'Filter' => array(
            'PracticeID' => '67149'
        )
    ));
    testPracticesCall($client, 'With Filter structure', $requestWithFilter);
    
    echo "\n=== Testing complete ===\n";
    echo "This will help us understand if practice code 67149 fixes the GetPractices endpoint.\n";
    
} catch (Exception $e) {
    echo "Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}
?>