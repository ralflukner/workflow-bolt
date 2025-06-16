<?php
/**
 * Tebra API Test Script - Environment Variable Version
 *
 * Expected environment variables:
 *  - TEBRA_USERNAME
 *  - TEBRA_PASSWORD
 *  - TEBRA_CUSTOMER_KEY
 */

$requiredEnv = ['TEBRA_USERNAME', 'TEBRA_PASSWORD', 'TEBRA_CUSTOMER_KEY'];
foreach ($requiredEnv as $var) {
    if (false === getenv($var)) {
        fwrite(STDERR, "Environment variable {$var} is not set.\n");
        exit(1);
    }
}

$username = getenv('TEBRA_USERNAME');
$password = getenv('TEBRA_PASSWORD');
$customerKey = getenv('TEBRA_CUSTOMER_KEY');

$wsdl = "https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl";

$soapOptions = [
    'trace' => 1,
    'exceptions' => 1,
    'login' => $username,
    'password' => $password,
    'cache_wsdl' => WSDL_CACHE_NONE,
];

try {
    echo "=== Tebra API Test (Env Var Version) ===\n";
    $client = new SoapClient($wsdl, $soapOptions);

    $request = [
        'request' => [
            'RequestHeader' => [
                'User' => $username,
                'Password' => $password,
                'CustomerKey' => $customerKey,
            ],
        ],
    ];

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
} 