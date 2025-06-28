<?php

/**
 * Test with correct practice name: "Lukner Medical Clinic"
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "=== Testing with Correct Practice Name: 'Lukner Medical Clinic' ===\n\n";

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
        echo "Request: " . json_encode($request, JSON_PRETTY_PRINT) . "\n";
        
        // Rate limiting
        sleep(2);
        
        try {
            $startTime = microtime(true);
            $response = $client->$endpoint(array('request' => $request));
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            echo "✓ SUCCESS (took {$duration}ms)\n";
            
            $resultProperty = $endpoint . 'Result';
            if (isset($response->$resultProperty->ErrorResponse->IsError) && $response->$resultProperty->ErrorResponse->IsError) {
                $error = $response->$resultProperty->ErrorResponse->ErrorMessage;
                echo "  ❌ API Error: $error\n";
                return false;
            } else {
                echo "  ✅ No errors - endpoint working!\n";
                
                // Show some data structure
                if (isset($response->$resultProperty)) {
                    $result = $response->$resultProperty;
                    $properties = get_object_vars($result);
                    echo "  Response properties: " . implode(', ', array_keys($properties)) . "\n";
                    
                    // Show specific data for appointments
                    if ($endpoint === 'GetAppointments' && isset($result->Appointments)) {
                        $appointments = $result->Appointments;
                        if (is_array($appointments)) {
                            echo "  Found " . count($appointments) . " appointments\n";
                        } else if (is_object($appointments)) {
                            echo "  Found 1 appointment\n";
                        }
                    }
                }
                
                return true;
            }
            
        } catch (Exception $e) {
            echo "  ❌ Exception: " . $e->getMessage() . "\n";
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
    
    // Test 1: GetAppointments with correct practice name
    echo "1. GetAppointments with correct practice name\n";
    $appointmentsRequest = array_merge($baseRequest, array(
        'PracticeName' => 'Lukner Medical Clinic'  // Correct name
    ));
    
    $success1 = testEndpoint($client, 'GetAppointments', 'With correct practice name', $appointmentsRequest);
    
    echo "\n" . str_repeat("=", 70) . "\n\n";
    
    // Test 2: GetAppointments with dates and correct practice name
    echo "2. GetAppointments with dates and correct practice name\n";
    $appointmentsWithDates = array_merge($baseRequest, array(
        'PracticeName' => 'Lukner Medical Clinic',
        'StartDate' => '6/15/2025',
        'EndDate' => '6/15/2025'
    ));
    
    $success2 = testEndpoint($client, 'GetAppointments', 'With dates and correct name', $appointmentsWithDates);
    
    echo "\n" . str_repeat("=", 70) . "\n\n";
    
    // Test 3: GetPractices with correct practice name
    echo "3. GetPractices with correct practice name\n";
    $practicesRequest = array_merge($baseRequest, array(
        'PracticeName' => 'Lukner Medical Clinic'
    ));
    
    $success3 = testEndpoint($client, 'GetPractices', 'With correct practice name', $practicesRequest);
    
    echo "\n" . str_repeat("=", 70) . "\n\n";
    
    // Test 4: Compare with wrong practice name
    echo "4. COMPARISON - GetAppointments with wrong practice name\n";
    $wrongNameRequest = array_merge($baseRequest, array(
        'PracticeName' => 'Lukner Clinic'  // Wrong name
    ));
    
    $success4 = testEndpoint($client, 'GetAppointments', 'With wrong practice name', $wrongNameRequest);
    
    echo "\n" . str_repeat("=", 70) . "\n\n";
    
    // Summary
    echo "SUMMARY:\n";
    echo "GetAppointments with 'Lukner Medical Clinic': " . ($success1 ? "✅ SUCCESS" : "❌ FAILED") . "\n";
    echo "GetAppointments with dates + correct name: " . ($success2 ? "✅ SUCCESS" : "❌ FAILED") . "\n";
    echo "GetPractices with 'Lukner Medical Clinic': " . ($success3 ? "✅ SUCCESS" : "❌ FAILED") . "\n";
    echo "GetAppointments with 'Lukner Clinic' (wrong): " . ($success4 ? "✅ SUCCESS" : "❌ FAILED") . "\n";
    
    if ($success1 || $success2) {
        echo "\n🎉 BREAKTHROUGH: Correct practice name fixes the issue!\n";
    } else {
        echo "\n😞 Practice name doesn't fix the ValidationHelper bug.\n";
    }
    
} catch (Exception $e) {
    echo "Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n=== Testing complete ===\n";