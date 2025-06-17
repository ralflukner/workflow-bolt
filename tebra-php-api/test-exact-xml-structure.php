<?php

/**
 * Test using EXACT XML structure from Tebra support
 */

// Load environment variables
if (file_exists(__DIR__ . '/.env')) {
    $envVars = parse_ini_file(__DIR__ . '/.env');
    foreach ($envVars as $key => $value) {
        putenv("$key=$value");
    }
}

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

$username = getenv('TEBRA_USERNAME');
$password = getenv('TEBRA_PASSWORD');
$customerKey = getenv('TEBRA_CUSTOMER_KEY');
$wsdlUrl = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';

echo "=== Testing GetAppointments with EXACT Tebra XML Structure ===\n\n";

try {
    // Create SOAP client with trace enabled
    $options = array(
        'soap_version' => SOAP_1_1,
        'trace' => true,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE
    );
    
    $client = new SoapClient($wsdlUrl, $options);
    echo "✓ SOAP client created successfully\n\n";
    
    // Test 1: Using exact structure from Tebra's XML with Filter section
    echo "Test 1: Using Filter section for dates (as shown in Tebra XML)\n";
    
    $request = array(
        'request' => array(
            'RequestHeader' => array(
                'CustomerKey' => $customerKey,
                'Password' => $password,
                'User' => $username
            ),
            'Fields' => array(
                // Leave empty to get all fields
            ),
            'Filter' => array(
                'StartDate' => '2025-06-16T00:00:00:Z',
                'EndDate' => '2025-06-16T23:59:59:Z'
            )
        )
    );
    
    echo "Request structure:\n";
    echo json_encode($request, JSON_PRETTY_PRINT) . "\n\n";
    
    try {
        $response = $client->GetAppointments($request);
        echo "✅ SUCCESS! Response received\n";
        
        // Check for appointments
        if (isset($response->GetAppointmentsResult)) {
            $result = $response->GetAppointmentsResult;
            if (isset($result->ErrorResponse) && $result->ErrorResponse->IsError) {
                echo "API Error: " . $result->ErrorResponse->ErrorMessage . "\n";
            } else if (isset($result->Appointments)) {
                $appointments = $result->Appointments;
                if (is_array($appointments)) {
                    echo "Found " . count($appointments) . " appointments\n";
                } else if (is_object($appointments)) {
                    echo "Found 1 appointment\n";
                } else {
                    echo "No appointments found\n";
                }
            }
        }
        
    } catch (SoapFault $e) {
        echo "❌ SOAP Fault: " . $e->getMessage() . "\n";
        echo "\nActual SOAP Request:\n";
        $xml = preg_replace('#(<(Password|CustomerKey|User)>)[^<]*(</\\2>)#', '$1***REDACTED***$3', $client->__getLastRequest());
        echo htmlspecialchars($xml);
    }
    
    echo "\n" . str_repeat("=", 60) . "\n\n";
    
    // Test 2: Try with practice name in Filter (in case it's required)
    echo "Test 2: With PracticeName in Filter\n";
    
    $request = array(
        'request' => array(
            'RequestHeader' => array(
                'CustomerKey' => $customerKey,
                'Password' => $password,
                'User' => $username
            ),
            'Fields' => array(),
            'Filter' => array(
                'StartDate' => '2025-06-16T00:00:00:Z',
                'EndDate' => '2025-06-16T23:59:59:Z',
                'PracticeName' => 'Lukner Clinic'
            )
        )
    );
    
    try {
        $response = $client->GetAppointments($request);
        echo "✅ SUCCESS with PracticeName!\n";
    } catch (SoapFault $e) {
        echo "❌ Failed with PracticeName: " . $e->getMessage() . "\n";
    }
    
    echo "\n" . str_repeat("=", 60) . "\n\n";
    
    // Test 3: Try without the colon before Z
    echo "Test 3: Standard ISO format (no colon before Z)\n";
    
    $request = array(
        'request' => array(
            'RequestHeader' => array(
                'CustomerKey' => $customerKey,
                'Password' => $password,
                'User' => $username
            ),
            'Fields' => array(),
            'Filter' => array(
                'StartDate' => '2025-06-16T00:00:00Z',
                'EndDate' => '2025-06-16T23:59:59Z'
            )
        )
    );
    
    try {
        $response = $client->GetAppointments($request);
        echo "✅ SUCCESS with standard ISO format!\n";
    } catch (SoapFault $e) {
        echo "❌ Failed with standard ISO: " . $e->getMessage() . "\n";
    }
    
    echo "\n" . str_repeat("=", 60) . "\n\n";
    
    // Test 4: Try simple date format
    echo "Test 4: Simple date format (YYYY-MM-DD)\n";
    
    $request = array(
        'request' => array(
            'RequestHeader' => array(
                'CustomerKey' => $customerKey,
                'Password' => $password,
                'User' => $username
            ),
            'Fields' => array(),
            'Filter' => array(
                'StartDate' => '2025-06-16',
                'EndDate' => '2025-06-16'
            )
        )
    );
    
    try {
        $response = $client->GetAppointments($request);
        echo "✅ SUCCESS with simple date format!\n";
    } catch (SoapFault $e) {
        echo "❌ Failed with simple date: " . $e->getMessage() . "\n";
    }
    
    // Show the actual SOAP XML being sent
    echo "\n=== Last SOAP Request XML ===\n";
    $dom = new DOMDocument();
    $dom->preserveWhiteSpace = false;
    $dom->formatOutput = true;
    if (@$dom->loadXML($client->__getLastRequest())) {
        echo $dom->saveXML();
    }
    
} catch (Exception $e) {
    echo "Fatal error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Test complete ===\n";