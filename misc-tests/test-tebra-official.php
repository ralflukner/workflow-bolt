<?php
/**
 * Test Tebra API using the official guide implementation
 */

// New credentials
$usernameEnv = getenv('TEBRA_USERNAME');
$passwordEnv = getenv('TEBRA_PASSWORD');
if (!$usernameEnv || !$passwordEnv) {
    die("❌ Required environment variables TEBRA_USERNAME and/or TEBRA_PASSWORD not set\n");
}
$username = $usernameEnv;
$password = $passwordEnv;
$customerKey = 'j57wt68dc39q';
$version = 'v2';

// Use working WSDL URL but with official guide authentication
$wsdlUrl = "https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl";

echo "🔍 Testing Tebra API with Official Guide Implementation\n";
echo "===================================================\n\n";

echo "Configuration:\n";
echo "- Username: " . $username . "\n";
echo "- Customer Key: " . $customerKey . "\n";
echo "- WSDL URL: " . $wsdlUrl . "\n\n";

// Test SoapClient with official guide approach
echo "TEST: Official Guide SoapClient Implementation\n";
echo "---------------------------------------------\n";

try {
    // Initialize with official guide options
    $options = [
        'soap_version' => SOAP_1_1,
        'trace' => true,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE,
        'features' => SOAP_SINGLE_ELEMENT_ARRAYS,
        'user_agent' => 'TebraSOAP-PHP-Client/1.0',
        'connection_timeout' => 30,
        'stream_context' => stream_context_create([
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
                'allow_self_signed' => false
            ]
        ])
    ];
    
    echo "Initializing SoapClient with WSDL: " . $wsdlUrl . "\n";
    $client = new SoapClient($wsdlUrl, $options);
    
    echo "✅ WSDL loaded successfully!\n\n";
    
    echo "Available functions:\n";
    $functions = $client->__getFunctions();
    foreach (array_slice($functions, 0, 10) as $function) {
        echo "  - " . $function . "\n";
    }
    echo "\n";
    
    // Create authentication header as per WSDL structure
    $authHeader = [
        'CustomerKey' => $customerKey,
        'User' => $username,  // The WSDL uses 'User' not 'Username'
        'Password' => $password
    ];
    
    echo "Testing GetProviders with corrected WSDL structure...\n";
    
    // Structure based on WSDL requirements
    $params = [
        'request' => [
            'RequestHeader' => $authHeader,
            'Fields' => null  // Optional fields parameter
        ]
    ];
    
    echo "Request parameters:\n";
    print_r($params);
    echo "\n";
    
    $result = $client->GetProviders($params);
    
    echo "✅ SUCCESS! GetProviders call completed!\n";
    echo "Result:\n";
    print_r($result);
    
} catch (SoapFault $e) {
    echo "❌ SoapFault Error: " . $e->getMessage() . "\n";
    echo "Fault Code: " . $e->faultcode . "\n";
    echo "Fault String: " . $e->faultstring . "\n\n";
    
    if (isset($client)) {
        echo "Last Request:\n";
        echo $client->__getLastRequest() . "\n\n";
        echo "Last Response:\n";
        echo $client->__getLastResponse() . "\n\n";
    }
} catch (Exception $e) {
    echo "❌ General Error: " . $e->getMessage() . "\n";
}

echo "\n🏁 Official guide test completed\n";
?>