<?php
/**
 * Exact official Tebra PHP example with our credentials
 */

try{
    $user        = getenv('TEBRA_USER');
    $password    = getenv('TEBRA_PASSWORD');
    $customerKey = getenv('TEBRA_CUSTOMER_KEY');

    if (!$user || !$password || !$customerKey) {
        throw new RuntimeException('Missing Tebra credentials – set TEBRA_* environment variables.');
    }

    // Helper to mask credentials (show first & last 2 chars, asterisk middle)
    $maskSensitive = function($value) {
        $len = strlen($value);
        if ($len <= 4) {
            return str_repeat('*', $len);
        }
        return substr($value, 0, 2) . str_repeat('*', $len - 4) . substr($value, -2);
    };

    $wsdl = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';
    $client = new SoapClient($wsdl);

    echo "🔍 Testing Exact Official Tebra PHP Example\n";
    echo "==========================================\n\n";
    echo "Credentials:\n";
    echo "- User: " . $maskSensitive($user) . "\n";
    echo "- Customer Key: " . $maskSensitive($customerKey) . "\n";
    echo "- WSDL: " . $wsdl . "\n\n";

    $request = array (
        'RequestHeader' => array('User' => $user, 'Password' => $password, 'CustomerKey' => $customerKey),
        'Filter' => array('FromLastModifiedDate' => '3/4/2012'),
        'Fields' => array('PatientFullName' => 'true')
    );

    $params = array('request' => $request);
    
    echo "Calling GetPatients with official example structure...\n";
    echo "Request structure:\n";
    print_r($params);
    echo "\n";
    
    $response = $client->GetPatients($params)->GetPatientsResult;

    echo "✅ SUCCESS! GetPatients call completed!\n\n";
    echo "Response structure:\n";
    print_r($response);
    echo "\n";

    if (isset($response->Patients->PatientData)) {
        echo "Patient data found:\n";
        foreach($response->Patients->PatientData as &$value)
        {
            print($value->PatientFullName. "\n");
        }
    } else {
        echo "No patient data in response or different structure.\n";
        echo "Full response:\n";
        print_r($response);
    }
    
} catch (Exception $err) {
    echo "❌ Error: ". $err->getMessage() . "\n";
    
    if (isset($client)) {
        echo "\nLast SOAP Request:\n";
        echo $client->__getLastRequest() . "\n";
        echo "\nLast SOAP Response:\n";
        echo $client->__getLastResponse() . "\n";
    }
}
?>