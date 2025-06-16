<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use LuknerLumina\TebraApi\TebraHttpClient;

/**
 * Simple test following the exact pattern as working getPatients method
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "=== Testing GetAppointments with Working Pattern ===\n\n";

try {
    // Initialize client
    $client = new TebraHttpClient();
    echo "✓ Client initialized successfully\n\n";
    
    // Get the private SOAP client via reflection (same as working getPatients)
    $reflection = new ReflectionClass($client);
    $clientProperty = $reflection->getProperty('client');
    $clientProperty->setAccessible(true);
    $soapClient = $clientProperty->getValue($client);
    
    // Get private properties
    $usernameProperty = $reflection->getProperty('username');
    $usernameProperty->setAccessible(true);
    $username = $usernameProperty->getValue($client);
    
    $passwordProperty = $reflection->getProperty('password');
    $passwordProperty->setAccessible(true);
    $password = $passwordProperty->getValue($client);
    
    $customerKeyProperty = $reflection->getProperty('customerKey');
    $customerKeyProperty->setAccessible(true);
    $customerKey = $customerKeyProperty->getValue($client);
    
    // Test 1: Minimal request (like getPatients but for appointments)
    echo "Test 1: Minimal GetAppointments request\n";
    
    $request = array (
        'RequestHeader' => array(
            'User' => $username, 
            'Password' => $password, 
            'CustomerKey' => $customerKey
        ),
        'PracticeName' => 'Lukner Clinic'  // Required field
    );
    
    $params = array('request' => $request);
    
    echo "Request structure:\n";
    echo json_encode($params, JSON_PRETTY_PRINT) . "\n\n";
    
    try {
        $response = $soapClient->GetAppointments($params);
        echo "✓ Success! Response:\n";
        print_r($response);
    } catch (Exception $e) {
        echo "✗ Error: " . $e->getMessage() . "\n";
        
        // Show SOAP request/response for debugging
        echo "\nSOAP Request:\n";
        echo $soapClient->__getLastRequest() . "\n";
        echo "\nSOAP Response:\n";
        echo $soapClient->__getLastResponse() . "\n";
    }
    
    echo "\n" . str_repeat("=", 60) . "\n\n";
    
    // Test 2: With StartDate and EndDate (using working date format)
    echo "Test 2: With date range (using M/d/yyyy format)\n";
    
    $request = array (
        'RequestHeader' => array(
            'User' => $username, 
            'Password' => $password, 
            'CustomerKey' => $customerKey
        ),
        'PracticeName' => 'Lukner Clinic',
        'StartDate' => '6/15/2025',  // Same format as working getPatients
        'EndDate' => '6/15/2025'
    );
    
    $params = array('request' => $request);
    
    echo "Request structure:\n";
    echo json_encode($params, JSON_PRETTY_PRINT) . "\n\n";
    
    try {
        $response = $soapClient->GetAppointments($params);
        echo "✓ Success! Response:\n";
        print_r($response);
    } catch (Exception $e) {
        echo "✗ Error: " . $e->getMessage() . "\n";
        
        // Show SOAP request/response for debugging
        echo "\nSOAP Request:\n";
        echo $soapClient->__getLastRequest() . "\n";
        echo "\nSOAP Response:\n";
        echo $soapClient->__getLastResponse() . "\n";
    }
    
    echo "\n" . str_repeat("=", 60) . "\n\n";
    
    // Test 3: Compare with working getPatients structure
    echo "Test 3: For comparison - working getPatients call\n";
    
    try {
        $patientsResult = $client->getPatients('3/4/2012');
        echo "✓ getPatients works! Structure for reference:\n";
        if (isset($patientsResult['data']->ErrorResponse)) {
            echo "ErrorResponse: ";
            print_r($patientsResult['data']->ErrorResponse);
        } else {
            echo "Success - no error response\n";
        }
    } catch (Exception $e) {
        echo "✗ getPatients failed: " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n=== Testing complete ===\n";