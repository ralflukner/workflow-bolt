<?php

/**
 * Test Tebra GetAppointments using old-school procedural PHP (no classes)
 * This matches the style that Tebra EHR SOAP expects
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "=== Testing GetAppointments with Procedural PHP ===\n\n";

// Get credentials from environment
$username = $_ENV['TEBRA_USERNAME'] ?? getenv('TEBRA_USERNAME');
$password = $_ENV['TEBRA_PASSWORD'] ?? getenv('TEBRA_PASSWORD'); 
$customerKey = $_ENV['TEBRA_CUSTOMER_KEY'] ?? getenv('TEBRA_CUSTOMER_KEY');
$wsdlUrl = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';

if (!$username || !$password || !$customerKey) {
    die("Missing Tebra credentials in environment variables\n");
}

echo "Credentials loaded successfully\n";
echo "WSDL URL: $wsdlUrl\n\n";

try {
    // Create SOAP client with minimal options (old-school style)
    $options = array(
        'soap_version' => SOAP_1_1,
        'trace' => true,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE
    );
    
    $client = new SoapClient($wsdlUrl, $options);
    echo "✓ SOAP client created successfully\n\n";
    
    // Test 1: Simple GetAppointments call (procedural style)
    echo "Test 1: Simple GetAppointments (procedural style)\n";
    
    $request = array(
        'User' => $username,
        'Password' => $password, 
        'CustomerKey' => $customerKey,
        'PracticeName' => 'Lukner Clinic'
    );
    
    echo "Request structure:\n";
    print_r($request);
    echo "\n";
    
    try {
        $response = $client->GetAppointments($request);
        echo "✓ Success! Response:\n";
        print_r($response);
    } catch (Exception $e) {
        echo "✗ Error: " . $e->getMessage() . "\n";
        echo "SOAP Request:\n" . $client->__getLastRequest() . "\n";
        echo "SOAP Response:\n" . $client->__getLastResponse() . "\n";
    }
    
    echo "\n" . str_repeat("=", 60) . "\n\n";
    
    // Test 2: With dates (procedural style)
    echo "Test 2: With StartDate/EndDate (procedural style)\n";
    
    $request = array(
        'User' => $username,
        'Password' => $password,
        'CustomerKey' => $customerKey,
        'PracticeName' => 'Lukner Clinic',
        'StartDate' => '6/15/2025',
        'EndDate' => '6/15/2025'
    );
    
    echo "Request structure:\n";
    print_r($request);
    echo "\n";
    
    try {
        $response = $client->GetAppointments($request);
        echo "✓ Success! Response:\n";
        print_r($response);
    } catch (Exception $e) {
        echo "✗ Error: " . $e->getMessage() . "\n";
        echo "SOAP Request:\n" . $client->__getLastRequest() . "\n";
        echo "SOAP Response:\n" . $client->__getLastResponse() . "\n";
    }
    
    echo "\n" . str_repeat("=", 60) . "\n\n";
    
    // Test 3: Compare with working GetPatients (procedural style)
    echo "Test 3: GetPatients for comparison (procedural style)\n";
    
    $request = array(
        'User' => $username,
        'Password' => $password,
        'CustomerKey' => $customerKey,
        'FromLastModifiedDate' => '3/4/2012'
    );
    
    try {
        $response = $client->GetPatients($request);
        echo "✓ GetPatients works! Response structure:\n";
        if (isset($response->GetPatientsResult->ErrorResponse->IsError) && $response->GetPatientsResult->ErrorResponse->IsError) {
            echo "Error: " . $response->GetPatientsResult->ErrorResponse->ErrorMessage . "\n";
        } else {
            echo "Success - no errors\n";
        }
    } catch (Exception $e) {
        echo "✗ GetPatients failed: " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n=== Testing complete ===\n";