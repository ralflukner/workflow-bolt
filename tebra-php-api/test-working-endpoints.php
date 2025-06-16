<?php

/**
 * Test more endpoints to find what works vs what has the ValidationHelper bug
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "=== Testing More Endpoints to Find Working vs Broken ===\n\n";

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
    function testEndpoint($client, $endpoint, $description, $request) {
        echo "Testing: $endpoint - $description\n";
        
        // Rate limiting
        sleep(2);
        
        try {
            $startTime = microtime(true);
            $response = $client->$endpoint(array('request' => $request));
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            $resultProperty = $endpoint . 'Result';
            if (isset($response->$resultProperty->ErrorResponse->IsError) && $response->$resultProperty->ErrorResponse->IsError) {
                $error = $response->$resultProperty->ErrorResponse->ErrorMessage;
                if (strpos($error, 'Object reference not set') !== false) {
                    echo "❌ BROKEN - ValidationHelper bug: $error\n";
                    return 'broken';
                } else {
                    echo "⚠️  OTHER ERROR: $error\n";
                    return 'other_error';
                }
            } else {
                echo "✅ WORKING - No errors (took {$duration}ms)\n";
                return 'working';
            }
            
        } catch (Exception $e) {
            echo "💥 EXCEPTION: " . $e->getMessage() . "\n";
            return 'exception';
        }
    }
    
    // Standard minimal request
    $baseRequest = array(
        'RequestHeader' => array(
            'User' => $username,
            'Password' => $password,
            'CustomerKey' => $customerKey
        )
    );
    
    $results = array();
    
    // Test working endpoints we know about
    echo "=== KNOWN WORKING ENDPOINTS ===\n";
    
    $patientsRequest = array_merge($baseRequest, array(
        'Filter' => array('FromLastModifiedDate' => '3/4/2012'),
        'Fields' => array('PatientFullName' => 'true')
    ));
    $results['GetPatients'] = testEndpoint($client, 'GetPatients', 'Known working', $patientsRequest);
    
    $results['GetProviders'] = testEndpoint($client, 'GetProviders', 'Minimal request', $baseRequest);
    
    echo "\n=== TESTING OTHER ENDPOINTS ===\n";
    
    // Test other endpoints with minimal requests
    $results['GetPractices'] = testEndpoint($client, 'GetPractices', 'Minimal request', $baseRequest);
    
    $results['GetServiceLocations'] = testEndpoint($client, 'GetServiceLocations', 'Minimal request', $baseRequest);
    
    // Try GetProcedureCode with a common code
    $procedureRequest = array_merge($baseRequest, array(
        'ProcedureCodeName' => '99213'
    ));
    $results['GetProcedureCode'] = testEndpoint($client, 'GetProcedureCode', 'With procedure code 99213', $procedureRequest);
    
    // Try GetCharges with date filter
    $chargesRequest = array_merge($baseRequest, array(
        'Filter' => array(
            'FromServiceDate' => '1/1/2024',
            'ToServiceDate' => '12/31/2024'
        )
    ));
    $results['GetCharges'] = testEndpoint($client, 'GetCharges', 'With date filter', $chargesRequest);
    
    echo "\n=== KNOWN BROKEN ENDPOINTS ===\n";
    
    $results['GetAppointments'] = testEndpoint($client, 'GetAppointments', 'Minimal request', $baseRequest);
    
    // Summary
    echo "\n" . str_repeat("=", 80) . "\n";
    echo "SUMMARY OF RESULTS:\n\n";
    
    $working = array();
    $broken = array();
    $other = array();
    
    foreach ($results as $endpoint => $status) {
        switch ($status) {
            case 'working':
                $working[] = $endpoint;
                echo "✅ $endpoint - WORKING\n";
                break;
            case 'broken':
                $broken[] = $endpoint;
                echo "❌ $endpoint - BROKEN (ValidationHelper bug)\n";
                break;
            case 'other_error':
                $other[] = $endpoint;
                echo "⚠️  $endpoint - Other error\n";
                break;
            case 'exception':
                echo "💥 $endpoint - Exception\n";
                break;
        }
    }
    
    echo "\n📊 STATISTICS:\n";
    echo "Working endpoints: " . count($working) . " (" . implode(', ', $working) . ")\n";
    echo "Broken endpoints: " . count($broken) . " (" . implode(', ', $broken) . ")\n";
    echo "Other issues: " . count($other) . " (" . implode(', ', $other) . ")\n";
    
    echo "\n🔍 CONCLUSION:\n";
    if (count($broken) > 1) {
        echo "Multiple endpoints have the same ValidationHelper bug - this is a systematic Tebra API issue.\n";
    }
    echo "We can use the working endpoints for our application.\n";
    
} catch (Exception $e) {
    echo "Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}
?>