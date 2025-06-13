<?php
/**
 * Tebra API Test Script - Simple Secure Version with Google Secret Manager
 * No traits or namespaces required - just a simple standalone script
 */

require_once __DIR__ . '/vendor/autoload.php';

use Google\Cloud\SecretManager\V1\Client\SecretManagerServiceClient;
use Google\Cloud\SecretManager\V1\AccessSecretVersionRequest;

echo "=== Tebra API Test (Secure Version with GSM) ===\n";

try {
    // Initialize Secret Manager client
    $secretManager = new SecretManagerServiceClient();
    $projectId = getenv('GOOGLE_CLOUD_PROJECT');

    if (!$projectId) {
        throw new Exception('Please set GOOGLE_CLOUD_PROJECT environment variable');
    }

    echo "Project ID: {$projectId}\n";
    echo "Retrieving credentials from Secret Manager...\n";

    // Helper function to get secret
    $getSecret = function($secretId) use ($secretManager, $projectId) {
        $name = $secretManager->secretVersionName($projectId, $secretId, 'latest');
        $request = (new AccessSecretVersionRequest())->setName($name);
        $response = $secretManager->accessSecretVersion($request);
        return $response->getPayload()->getData();
    };

    // Retrieve credentials
    $username = $getSecret('tebra-username');
    $password = $getSecret('tebra-password');
    $customerKey = $getSecret('tebra-customer-key');

    echo "Credentials retrieved successfully.\n";
    echo "User: " . substr($username, 0, 3) . str_repeat('*', strlen($username) - 3) . "\n";
    echo "Customer Key: " . substr($customerKey, 0, 2) . str_repeat('*', strlen($customerKey) - 2) . "\n\n";

    // SOAP Configuration
    $wsdl = "https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl";
    echo "WSDL: {$wsdl}\n";
    echo "Creating SOAP client...\n";

    $soapOptions = [
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

    $client = new SoapClient($wsdl, $soapOptions);
    echo "SOAP client created successfully.\n\n";

    // Test GetProviders operation
    echo "Testing GetProviders operation...\n";

    $request = [
        'request' => [
            'RequestHeader' => [
                'User' => $username,
                'Password' => $password,
                'CustomerKey' => $customerKey
            ]
        ]
    ];

    echo "Sending SOAP request...\n";
    $result = $client->GetProviders($request);

    echo "SUCCESS! Response received:\n";
    print_r($result);

    // Close Secret Manager client
    $secretManager->close();

} catch (SoapFault $e) {
    echo "SOAP ERROR: " . $e->getMessage() . "\n";
    if (isset($client)) {
        echo "\nLast Request:\n" . $client->__getLastRequest() . "\n";
        echo "\nLast Response:\n" . $client->__getLastResponse() . "\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";

    // Helpful error messages
    if (strpos($e->getMessage(), 'GOOGLE_CLOUD_PROJECT') !== false) {
        echo "\nTo fix this:\n";
        echo "export GOOGLE_CLOUD_PROJECT='your-project-id'\n";
    } elseif (strpos($e->getMessage(), '403') !== false || strpos($e->getMessage(), 'PERMISSION_DENIED') !== false) {
        echo "\nTo fix this, grant yourself access:\n";
        echo "gcloud secrets add-iam-policy-binding tebra-username --member='user:your-email@example.com' --role='roles/secretmanager.secretAccessor'\n";
        echo "gcloud secrets add-iam-policy-binding tebra-password --member='user:your-email@example.com' --role='roles/secretmanager.secretAccessor'\n";
        echo "gcloud secrets add-iam-policy-binding tebra-customer-key --member='user:your-email@example.com' --role='roles/secretmanager.secretAccessor'\n";
    }
} finally {
    if (isset($secretManager)) {
        $secretManager->close();
    }
}
?>