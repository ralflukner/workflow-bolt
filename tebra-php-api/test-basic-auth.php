<?php
// test-basic-auth.php
// Test basic Tebra authentication with minimal request

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configuration
$config = [
    'wsdl' => 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl',
    'username' => getenv('VITE_TEBRA_USERNAME') ?: getenv('TEBRA_USER') ?: 'your-username',
    'password' => getenv('VITE_TEBRA_PASSWORD') ?: getenv('TEBRA_PASSWORD') ?: 'your-password',
    'customerKey' => getenv('VITE_TEBRA_CUSTOMER_KEY') ?: getenv('TEBRA_CUSTOMER_KEY') ?: 'your-customer-key',
];

echo "=== Tebra Basic Authentication Test ===\n";
echo "Username: " . substr($config['username'], 0, 10) . "...\n";
echo "Password: " . substr($config['password'], 0, 10) . "...\n";
echo "Customer Key: " . $config['customerKey'] . "\n\n";

try {
    // Initialize SOAP client
    $client = new SoapClient($config['wsdl'], [
        'trace' => 1,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE,
        'features' => SOAP_SINGLE_ELEMENT_ARRAYS
    ]);
    
    echo "=== Test 1: GetProviders (simplest auth test) ===\n";
    
    $params = [
        'request' => [
            'RequestHeader' => [
                'User' => $config['username'],
                'Password' => $config['password'],
                'CustomerKey' => $config['customerKey']
            ]
        ]
    ];
    
    $response = $client->__soapCall('GetProviders', [$params]);
    
    // Check authentication
    $authenticated = $response->GetProvidersResult->SecurityResponse->Authenticated ?? false;
    echo "Authenticated: " . ($authenticated ? 'YES' : 'NO') . "\n";
    
    if (!$authenticated) {
        $securityMessage = $response->GetProvidersResult->SecurityResponse->SecurityMessage ?? 'Unknown';
        echo "Security Error: $securityMessage\n";
        
        // Show the SOAP request for debugging
        echo "\n=== SOAP Request (XML) ===\n";
        $xml = $client->__getLastRequest();
        echo $xml . "\n";
        
        echo "\n=== SOAP Response (XML) ===\n";
        $response_xml = $client->__getLastResponse();
        echo $response_xml . "\n";
    } else {
        echo "✅ Authentication successful!\n";
        
        // Show provider info if available
        if (isset($response->GetProvidersResult->Providers)) {
            $providers = $response->GetProvidersResult->Providers->ProviderData ?? [];
            if (!is_array($providers)) $providers = [$providers];
            
            echo "Found " . count($providers) . " providers:\n";
            foreach ($providers as $provider) {
                echo "- " . ($provider->FirstName ?? '') . " " . ($provider->LastName ?? '') . "\n";
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
        
        echo "\nLast SOAP Response:\n";
        echo $client->__getLastResponse() . "\n";
    }
} catch (Exception $e) {
    echo "\nERROR: " . $e->getMessage() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Test Complete ===\n";