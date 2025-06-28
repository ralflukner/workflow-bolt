<?php
// test-tebra-appointments-with-practice.php
// Test Tebra appointments WITH required practice filter

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configuration
$config = [
    'wsdl' => 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl',
    'username' => getenv('VITE_TEBRA_USERNAME') ?: getenv('TEBRA_USER') ?: 'your-username',
    'password' => getenv('VITE_TEBRA_PASSWORD') ?: getenv('TEBRA_PASSWORD') ?: 'your-password',
    'customerKey' => getenv('VITE_TEBRA_CUSTOMER_KEY') ?: getenv('TEBRA_CUSTOMER_KEY') ?: 'your-customer-key',
    'practiceName' => 'Lukner Medical Clinic',
    'practiceId' => '67149'  // Practice ID provided by user
];

echo "=== Tebra Appointment Test (With Practice Filter) ===\n";
echo "Practice: " . $config['practiceName'] . " (ID: " . $config['practiceId'] . ")\n";
echo "Username: " . substr($config['username'], 0, 10) . "...\n";
echo "Password: " . substr($config['password'], 0, 10) . "...\n";
echo "Customer Key: " . $config['customerKey'] . "\n\n";

// First, let's try to get the list of practices to see what's available
echo "=== Step 1: Getting Practice List ===\n";
try {
    $client = new SoapClient($config['wsdl'], [
        'trace' => 1,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE,
        'features' => SOAP_SINGLE_ELEMENT_ARRAYS
    ]);
    
    $practiceParams = [
        'request' => [
            'RequestHeader' => [
                'User' => $config['username'],
                'Password' => $config['password'],
                'CustomerKey' => $config['customerKey']
            ]
        ]
    ];
    
    $practiceResponse = $client->__soapCall('GetPractices', [$practiceParams]);
    $practiceAuth = $practiceResponse->GetPracticesResult->SecurityResponse->Authenticated ?? false;
    echo "Practice API Authenticated: " . ($practiceAuth ? 'YES' : 'NO') . "\n";
    
    if ($practiceAuth && isset($practiceResponse->GetPracticesResult->Practices)) {
        $practices = $practiceResponse->GetPracticesResult->Practices->PracticeData ?? [];
        if (!is_array($practices)) $practices = [$practices];
        
        echo "Found " . count($practices) . " practices:\n";
        foreach ($practices as $practice) {
            echo "- Name: " . ($practice->PracticeName ?? 'N/A') . "\n";
            echo "  ID: " . ($practice->PracticeID ?? 'N/A') . "\n";
            echo "  Code: " . ($practice->PracticeCode ?? 'N/A') . "\n";
        }
    }
} catch (Exception $e) {
    echo "Error getting practices: " . $e->getMessage() . "\n";
}

echo "\n=== Step 2: Testing Appointments ===\n";

try {
    // Initialize SOAP client
    $client = new SoapClient($config['wsdl'], [
        'trace' => 1,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE,
        'features' => SOAP_SINGLE_ELEMENT_ARRAYS
    ]);
    
    // Test multiple dates to find where appointments exist
    $testDates = [
        '2025-06-22',  // Today
        '2025-06-23',  // Tomorrow 
        '2025-06-24',  // Day after (where you say 3 appointments exist)
        '2025-06-25'   // Just to check
    ];
    
    foreach ($testDates as $testDate) {
        echo "\n=== Testing Date: $testDate ===\n";
        
        // Create dates in Chicago timezone
        $chicagoTz = new DateTimeZone('America/Chicago');
        $utcTz = new DateTimeZone('UTC');
        
        // Start of day
        $startDate = new DateTime($testDate . ' 00:00:00', $chicagoTz);
        $startDate->setTimezone($utcTz);
        $startDateStr = $startDate->format('Y-m-d\TH:i:s\Z');
        
        // End of day
        $endDate = new DateTime($testDate . ' 23:59:59', $chicagoTz);
        $endDate->setTimezone($utcTz);
        $endDateStr = $endDate->format('Y-m-d\TH:i:s\Z');
        
        echo "Start: $startDateStr (UTC)\n";
        echo "End: $endDateStr (UTC)\n";
        
        // Build request with all possible variations
        $params = [
            'request' => [
                'RequestHeader' => [
                    'User' => $config['username'],
                    'Password' => $config['password'],
                    'CustomerKey' => $config['customerKey']
                ],
                'Fields' => new stdClass(),
                'Filter' => [
                    'StartDate' => $startDateStr,
                    'EndDate' => $endDateStr,
                    'PracticeName' => $config['practiceName'],
                    'PracticeID' => $config['practiceId']
                ]
            ]
        ];
        
        // Make the call
        $response = $client->__soapCall('GetAppointments', [$params]);
        
        // Check authentication
        $authenticated = $response->GetAppointmentsResult->SecurityResponse->Authenticated ?? false;
        echo "Authenticated: " . ($authenticated ? 'YES' : 'NO') . "\n";
        
        if (!$authenticated) {
            $securityMessage = $response->GetAppointmentsResult->SecurityResponse->SecurityMessage ?? 'Unknown';
            echo "Security Error: $securityMessage\n";
            
            // Show the SOAP request for debugging
            echo "\n=== SOAP Request (XML) ===\n";
            $xml = $client->__getLastRequest();
            // Pretty print first 1500 chars
            $dom = new DOMDocument();
            $dom->preserveWhiteSpace = false;
            $dom->formatOutput = true;
            if (@$dom->loadXML($xml)) {
                echo substr($dom->saveXML(), 0, 1500) . "...\n";
            } else {
                echo substr($xml, 0, 1500) . "...\n";
            }
            
            continue;
        }
        
        // Debug response structure
        echo "\nResponse structure:\n";
        if (isset($response->GetAppointmentsResult)) {
            echo "- GetAppointmentsResult exists\n";
            
            if (isset($response->GetAppointmentsResult->Appointments)) {
                echo "- Appointments exists\n";
                
                // Check what's actually in Appointments
                $appointmentsObj = $response->GetAppointmentsResult->Appointments;
                echo "- Appointments type: " . gettype($appointmentsObj) . "\n";
                
                if (is_object($appointmentsObj)) {
                    $properties = get_object_vars($appointmentsObj);
                    echo "- Appointments properties: " . implode(', ', array_keys($properties)) . "\n";
                }
                
                // Try to get appointments
                $appointments = $response->GetAppointmentsResult->Appointments->AppointmentData ?? null;
                
                if ($appointments === null) {
                    echo "- AppointmentData is null\n";
                } elseif (is_array($appointments)) {
                    echo "- Found " . count($appointments) . " appointments\n";
                } elseif (is_object($appointments)) {
                    echo "- Found 1 appointment (object)\n";
                    $appointments = [$appointments];
                } else {
                    echo "- AppointmentData type: " . gettype($appointments) . "\n";
                }
                
                // Display appointments if found
                if ($appointments && count($appointments) > 0) {
                    foreach ($appointments as $idx => $apt) {
                        echo "\nAppointment #" . ($idx + 1) . ":\n";
                        echo "- Patient: " . ($apt->PatientFullName ?? 'N/A') . "\n";
                        echo "- Time: " . ($apt->StartDate ?? 'N/A') . "\n";
                        echo "- Provider: " . ($apt->ServiceProviderFullName ?? 'N/A') . "\n";
                    }
                }
            } else {
                echo "- Appointments property missing!\n";
            }
        }
        
        // Show raw XML response for debugging
        if ($testDate === '2025-06-24') {  // Focus on the date that should have 3 appointments
            echo "\n=== Raw SOAP Response (XML) ===\n";
            $xml = $client->__getLastResponse();
            // Pretty print first 1000 chars
            $dom = new DOMDocument();
            $dom->preserveWhiteSpace = false;
            $dom->formatOutput = true;
            if (@$dom->loadXML($xml)) {
                echo substr($dom->saveXML(), 0, 2000) . "...\n";
            }
        }
    }
    
} catch (SoapFault $e) {
    echo "\nSOAP FAULT:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "Code: " . $e->faultcode . "\n";
    echo "String: " . $e->faultstring . "\n";
    
    // Show last request for debugging
    if ($client) {
        echo "\nLast SOAP Request:\n";
        echo $client->__getLastRequest() . "\n";
    }
} catch (Exception $e) {
    echo "\nERROR: " . $e->getMessage() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Test Complete ===\n";