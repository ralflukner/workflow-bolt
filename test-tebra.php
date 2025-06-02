<?php
/**
 * Tebra API Test Script - Based on Official PHP Example
 * Tests GetProviders operation with proper request structure
 */

try {
    $user = 'work-flow@luknerclinic.com';
    $password = 'Y2ISY-x@mf1B4renpKHV3w49';
    $customerKey = 'j57wt68dc39q';

    $wsdl = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';
    
    echo "=== Tebra API Test (PHP) ===\n";
    echo "WSDL: $wsdl\n";
    echo "User: $user\n";
    echo "Customer Key: $customerKey\n\n";

    // Create SOAP client
    echo "Creating SOAP client...\n";
    $client = new SoapClient($wsdl, array(
        'trace' => 1,
        'exceptions' => true
    ));

    // Test GetProviders operation
    echo "Testing GetProviders operation...\n";
    $request = array(
        'RequestHeader' => array(
            'User' => $user, 
            'Password' => $password, 
            'CustomerKey' => $customerKey
        )
    );

    $params = array('request' => $request);
    
    echo "Request structure:\n";
    print_r($params);
    echo "\n";

    echo "Sending SOAP request...\n";
    $response = $client->GetProviders($params);

    echo "SUCCESS! Response received:\n";
    print_r($response);

} catch (SoapFault $fault) {
    echo "SOAP Fault occurred:\n";
    echo "Fault Code: " . $fault->faultcode . "\n";
    echo "Fault String: " . $fault->faultstring . "\n";
    echo "Detail: " . (isset($fault->detail) ? print_r($fault->detail, true) : 'None') . "\n";
    
    echo "\nLast Request XML:\n";
    echo $client->__getLastRequest() . "\n";
    
    echo "\nLast Response XML:\n";
    echo $client->__getLastResponse() . "\n";
    
} catch (Exception $err) {
    echo "Error: " . $err->getMessage() . "\n";
    echo "Trace: " . $err->getTraceAsString() . "\n";
}
?> 