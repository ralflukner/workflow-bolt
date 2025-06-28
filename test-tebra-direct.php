<?php
/**
 * Direct PHP test of Tebra SOAP API
 * This bypasses all our infrastructure to test Tebra API directly
 */

// Tebra credentials - using the correct ones
$username = 'pqpyiN-cAGRih-nEdayT-Cc@luknerclinic.com';
$password = 'kPRu_w-eg8v.)-3=;(v4-6LK.78-5warim';
$customerKey = 'j57wt68dc39q';
$wsdlUrl = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc';

echo "🔍 Testing Tebra SOAP API directly with PHP\n";
echo "==========================================\n\n";

echo "Credentials:\n";
echo "- Username: " . $username . "\n";
echo "- Customer Key: " . $customerKey . "\n";
echo "- Service URL: " . $wsdlUrl . "\n\n";

// Test 1: Basic cURL POST to the service endpoint
echo "TEST 1: Direct cURL SOAP Request\n";
echo "--------------------------------\n";

$soapEnvelope = '<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:kar="http://www.kareo.com/api/schemas/">
    <soap:Header>
        <kar:RequestHeader>
            <kar:CustomerKey>' . htmlspecialchars($customerKey) . '</kar:CustomerKey>
            <kar:User>' . htmlspecialchars($username) . '</kar:User>
            <kar:Password>' . htmlspecialchars($password) . '</kar:Password>
        </kar:RequestHeader>
    </soap:Header>
    <soap:Body>
        <kar:GetProviders />
    </soap:Body>
</soap:Envelope>';

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $wsdlUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $soapEnvelope,
    CURLOPT_HTTPHEADER => [
        'Content-Type: text/xml; charset=utf-8',
        'SOAPAction: "http://www.kareo.com/api/schemas/KareoServices/GetProviders"',
        'Content-Length: ' . strlen($soapEnvelope)
    ],
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_VERBOSE => true,
    CURLOPT_STDERR => fopen('php://temp', 'w+')
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

echo "HTTP Status: " . $httpCode . "\n";
if ($error) {
    echo "cURL Error: " . $error . "\n";
}

echo "Response Body:\n";
echo $response . "\n\n";

curl_close($ch);

// Test 2: Try with PHP's built-in SoapClient
echo "TEST 2: PHP SoapClient (if available)\n";
echo "------------------------------------\n";

if (class_exists('SoapClient')) {
    try {
        // First get the WSDL
        $wsdlFullUrl = $wsdlUrl . '?wsdl';
        echo "Trying WSDL URL: " . $wsdlFullUrl . "\n";
        
        $soapClient = new SoapClient($wsdlFullUrl, [
            'soap_version' => SOAP_1_1,
            'trace' => true,
            'exceptions' => true,
            'cache_wsdl' => WSDL_CACHE_NONE,
            'stream_context' => stream_context_create([
                'http' => [
                    'timeout' => 30,
                ]
            ])
        ]);
        
        echo "WSDL loaded successfully!\n";
        echo "Available functions:\n";
        $functions = $soapClient->__getFunctions();
        foreach (array_slice($functions, 0, 5) as $function) {
            echo "  - " . $function . "\n";
        }
        
        // Try to call GetProviders
        echo "\nCalling GetProviders...\n";
        
        // Create SOAP header for authentication
        $headerData = [
            'CustomerKey' => $customerKey,
            'User' => $username,
            'Password' => $password
        ];
        
        $soapHeader = new SoapHeader('http://www.kareo.com/ServiceContracts/2.1', 'RequestHeader', $headerData);
        $soapClient->__setSoapHeaders($soapHeader);
        
        $result = $soapClient->GetProviders();
        echo "SoapClient Success!\n";
        echo "Result: " . print_r($result, true) . "\n";
        
    } catch (SoapFault $e) {
        echo "SoapClient Error: " . $e->getMessage() . "\n";
        echo "Fault Code: " . $e->faultcode . "\n";
        echo "Fault String: " . $e->faultstring . "\n";
        
        if (method_exists($soapClient, '__getLastRequest')) {
            echo "\nLast Request:\n" . $soapClient->__getLastRequest() . "\n";
            echo "\nLast Response:\n" . $soapClient->__getLastResponse() . "\n";
        }
    } catch (Exception $e) {
        echo "General Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "SoapClient class not available in this PHP installation\n";
}

echo "\n🏁 Direct PHP test completed\n";
?>