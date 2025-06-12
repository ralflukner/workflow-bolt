<?php
/**
 * Tebra API Test Script - Based on Official PHP Example
 * Tests GetProviders operation with proper request structure
 */

// Tebra API credentials
$username = 'ZEp7U8-VeHuza@luknerclinic.com';
$password = '8<O{*a3SF297i]CDFW5mmZ&asx519M';
$customerKey = 'j57wt68dc39q';

// Construct WSDL URL (simplified)
$wsdl = "https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl";

echo "=== Tebra API Test (PHP) ===\n";
echo "WSDL: {$wsdl}\n";
echo "User: {$username}\n";
echo "Customer Key: {$customerKey}\n\n";

try {
    echo "Creating SOAP client...\n";
    $options = [
        'trace' => 1,
        'exceptions' => 1,
        'login' => $username,
        'password' => $password,
        'cache_wsdl' => WSDL_CACHE_NONE,
        'stream_context' => stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
            ]
        ])
    ];

    $client = new SoapClient($wsdl, $options);
    echo "SOAP client created successfully.\n";

    echo "Testing GetProviders operation...\n";
    
    // Prepare the request structure
    $request = [
        'request' => [
            'RequestHeader' => [
                'User' => $username,
                'Password' => $password,
                'CustomerKey' => $customerKey
            ]
        ]
    ];

    echo "Request structure:\n";
    print_r($request);
    echo "\n";

    echo "Sending SOAP request...\n";
    $result = $client->GetProviders($request);
    
    echo "SUCCESS! Response received:\n";
    print_r($result);

} catch (SoapFault $e) {
    echo "SOAP ERROR: " . $e->getMessage() . "\n";
    if (isset($client)) {
        echo "\nLast Request:\n" . $client->__getLastRequest() . "\n";
        echo "\nLast Response:\n" . $client->__getLastResponse() . "\n";
    }
} catch (Exception $e) {
    echo "GENERAL ERROR: " . $e->getMessage() . "\n";
    if (isset($client)) {
        echo "\nLast Request:\n" . $client->__getLastRequest() . "\n";
        echo "\nLast Response:\n" . $client->__getLastResponse() . "\n";
    }
}
?> 