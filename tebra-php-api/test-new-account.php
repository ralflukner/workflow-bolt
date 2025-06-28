<?php
/**
 * Test template for new Tebra account credentials
 * UPDATE: Replace NEW_USERNAME_HERE and NEW_PASSWORD_HERE with actual values
 */

$config = [
    'wsdl'        => 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl',
    'username'    => 'workfl278290@luknerclinic.com',
    'password'    => 'LS35-O28Bc-71n',
    'customerKey' => 'j57wt68dc39q',       // Keep existing - validates successfully
    'practiceName'=> 'Lukner Medical Clinic',
    'practiceId'  => '67149',
];

echo "=== Testing New Tebra Account ===\n";
echo "Username: {$config['username']}\n";
echo "Customer Key: {$config['customerKey']}\n\n";

if ($config['username'] === 'NEW_USERNAME_HERE' || $config['password'] === 'NEW_PASSWORD_HERE') {
    echo "❌ ERROR: Please update NEW_USERNAME_HERE and NEW_PASSWORD_HERE with actual credentials\n";
    exit(1);
}

try {
    $client = new SoapClient($config['wsdl'], [
        'trace'        => 1,
        'exceptions'   => true,
        'features'     => SOAP_SINGLE_ELEMENT_ARRAYS,
        'cache_wsdl'   => WSDL_CACHE_NONE,
    ]);

    // Test 1: GetProviders
    echo "=== Test 1: GetProviders ===\n";
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

    $resp = $client->__soapCall('GetProviders', [$params]);
    $auth = $resp->GetProvidersResult->SecurityResponse->Authenticated ?? false;
    echo "GetProviders Authenticated: " . ($auth ? 'YES' : 'NO') . "\n";

    if (!$auth) {
        $securityResult = $resp->GetProvidersResult->SecurityResponse->SecurityResult ?? 'Unknown';
        echo "Security Error: $securityResult\n";
        $customerKeyValid = $resp->GetProvidersResult->SecurityResponse->CustomerKeyValid ?? 'Unknown';
        echo "CustomerKeyValid: $customerKeyValid\n";
    } else {
        $providers = $resp->GetProvidersResult->Providers->ProviderData ?? [];
        $providers = is_array($providers) ? $providers : ($providers ? [$providers] : []);
        echo "Providers found: " . count($providers) . "\n";
    }

    // Test 2: GetAppointments (only if GetProviders succeeds)
    if ($auth) {
        echo "\n=== Test 2: GetAppointments ===\n";
        
        // Use working date conversion
        $chi = new DateTimeZone('America/Chicago');
        $utc = new DateTimeZone('UTC');
        
        $start = new DateTime('2025-06-24 00:00:00', $chi);
        $end   = new DateTime('2025-06-24 23:59:59', $chi);
        $start->setTimezone($utc);
        $end->setTimezone($utc);
        
        $startDateIso = $start->format('Y-m-d\TH:i:s\Z');
        $endDateIso   = $end->format('Y-m-d\TH:i:s\Z');
        
        $params = [
            'request' => [
                'RequestHeader' => [
                    'User'        => $config['username'],
                    'Password'    => $config['password'],
                    'CustomerKey' => $config['customerKey'],
                ],
                'Fields' => new stdClass(),
                'Filter' => [
                    'StartDate'   => $startDateIso,
                    'EndDate'     => $endDateIso,
                    'PracticeName'=> $config['practiceName'],
                    'PracticeID'  => $config['practiceId'],
                ],
            ],
        ];
        
        $resp = $client->__soapCall('GetAppointments', [$params]);
        $auth = $resp->GetAppointmentsResult->SecurityResponse->Authenticated ?? false;
        echo "GetAppointments Authenticated: " . ($auth ? 'YES' : 'NO') . "\n";
        
        if ($auth) {
            $appts = $resp->GetAppointmentsResult->Appointments->AppointmentData ?? [];
            $appts = is_array($appts) ? $appts : ($appts ? [$appts] : []);
            echo "Appointments found: " . count($appts) . "\n";
            
            if (count($appts) > 0) {
                echo "\nFirst appointment:\n";
                $appt = $appts[0];
                echo "  Time: " . ($appt->StartTime ?? 'Unknown') . "\n";
                echo "  Patient: " . ($appt->PatientFullName ?? 'Unknown') . "\n";
                echo "  Provider: " . ($appt->ServiceProviderFullName ?? 'Unknown') . "\n";
            }
        }
    }

    echo "\n" . ($auth ? "✅ NEW ACCOUNT SUCCESS" : "❌ NEW ACCOUNT FAILED") . "\n";

} catch (Exception $e) {
    echo "❌ SOAP Error: " . $e->getMessage() . "\n";
    if (isset($client)) {
        echo "\nLast Request:\n" . $client->__getLastRequest() . "\n";
        echo "\nLast Response:\n" . $client->__getLastResponse() . "\n";
    }
}
?>