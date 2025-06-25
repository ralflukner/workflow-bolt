<?php
/**
 * Test GetProviders endpoint with current credentials
 */

$config = [
    'wsdl'        => 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl',
    'username'    => 'workfl278290@luknerclinic.com',
    'password'    => 'LS35-O28Bc-71n',
    'customerKey' => 'j57wt68dc39q',
    'practiceName'=> 'Lukner Medical Clinic',
    'practiceId'  => '67149',
];

echo "=== Testing GetProviders Endpoint ===\n";
echo "Username: {$config['username']}\n";
echo "Customer Key: {$config['customerKey']}\n\n";

try {
    $client = new SoapClient($config['wsdl'], [
        'trace'        => 1,
        'exceptions'   => true,
        'features'     => SOAP_SINGLE_ELEMENT_ARRAYS,
        'cache_wsdl'   => WSDL_CACHE_NONE,
    ]);

    $params = [
        'request' => [
            'RequestHeader' => [
                'User'        => $config['username'],
                'Password'    => $config['password'],
                'CustomerKey' => $config['customerKey'],
            ],
            'Fields' => new stdClass(),
            'Filter' => [
                'PracticeName'=> $config['practiceName'],
                'PracticeID'  => $config['practiceId'],
            ],
        ],
    ];

    echo "Making GetProviders SOAP call...\n";
    $resp = $client->__soapCall('GetProviders', [$params]);

    // Check authentication
    $auth = $resp->GetProvidersResult->SecurityResponse->Authenticated ?? false;
    echo "Authenticated: " . ($auth ? 'YES' : 'NO') . "\n";

    if (!$auth) {
        $securityResult = $resp->GetProvidersResult->SecurityResponse->SecurityResult ?? 'Unknown';
        echo "Security Error: $securityResult\n";
        
        $customerKeyValid = $resp->GetProvidersResult->SecurityResponse->CustomerKeyValid ?? 'Unknown';
        echo "CustomerKeyValid: $customerKeyValid\n";
    } else {
        // Get providers
        $providers = $resp->GetProvidersResult->Providers->ProviderData ?? [];
        $providers = is_array($providers) ? $providers : ($providers ? [$providers] : []);
        echo "Providers found: " . count($providers) . "\n";
        
        if (count($providers) > 0) {
            echo "\nFirst provider:\n";
            $provider = $providers[0];
            echo "  Name: " . ($provider->FullName ?? 'Unknown') . "\n";
            echo "  ID: " . ($provider->ProviderID ?? 'Unknown') . "\n";
        }
    }

    echo "\n" . ($auth ? "✅ GetProviders SUCCESS" : "❌ GetProviders FAILED") . "\n";

} catch (Exception $e) {
    echo "❌ SOAP Error: " . $e->getMessage() . "\n";
    if (isset($client)) {
        echo "\nLast Request:\n" . $client->__getLastRequest() . "\n";
        echo "\nLast Response:\n" . $client->__getLastResponse() . "\n";
    }
}
?>