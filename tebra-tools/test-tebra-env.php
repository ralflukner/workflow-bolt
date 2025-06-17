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

    // Debug output is optional; enable by setting TEBRA_VERBOSE=true
    $verbose = getenv('TEBRA_VERBOSE') === 'true';
    if ($verbose && isset($client)) {
        // Redact sensitive credentials before printing
        $sanitize = function (string $xml): string {
            return preg_replace('/<Password>.*?<\/Password>/is', '<Password>[REDACTED]</Password>', $xml);
        };

        echo "\nLast Request (sanitized):\n" . $sanitize($client->__getLastRequest()) . "\n";
        echo "\nLast Response:\n" . $sanitize($client->__getLastResponse()) . "\n";
    } elseif (!$verbose) {
        echo "(Enable TEBRA_VERBOSE=true to see sanitized SOAP request/response)\n";
    }
} catch (SoapFault $e) {
    echo "SOAP ERROR: " . $e->getMessage() . "\n";
} 