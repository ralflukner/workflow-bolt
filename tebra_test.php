<?php
// Replace these with your actual credentials
$username = 'ZEp7U8-VeHuza@luknerclinic.com';
$password = '8<O{*a3SF297i]CDFW5mmZ&asx519M';
$customerKey = 'j57wt68dc39q';

// Construct the WSDL URL
$wsdl = "https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl&customerkey={$customerKey}";

try {
    // Create the SOAP client with basic authentication
    $client = new SoapClient($wsdl, [
        'login'    => $username,
        'password' => $password,
        'trace'    => 1, // Enables tracing for debugging
        'exceptions' => 1,
    ]);

    // Example: Call a method (replace with a real method if needed)
    // $result = $client->TestConnection();
    // var_dump($result);

    // List available functions
    $functions = $client->__getFunctions();
    echo "Available SOAP functions:\n";
    print_r($functions);

} catch (Exception $e) {
    echo "SOAP Connection failed:\n";
    echo $e->getMessage() . "\n";
    // For debugging, you can also print the last SOAP request/response
    // echo $client->__getLastRequest();
    // echo $client->__getLastResponse();
}
