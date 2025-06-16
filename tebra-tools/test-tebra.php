<?php
/**
 * Tebra API Test Script - Simple Secure Version with Google Secret Manager
 * No traits or namespaces required - just a simple standalone script
 */

// Ensure Composer dependencies are installed
$autoloadPath = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    fwrite(STDERR, "Composer autoload not found. Run `composer install` first.\n");
    exit(1);
}
require_once $autoloadPath;

use Google\Cloud\SecretManager\V1\SecretManagerServiceClient;
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

    // Helper function to get secret with fallback to gcloud command
    $getSecret = function($secretId) use ($secretManager, $projectId) {
        // First try the PHP client
        try {
            // Use the proper method to construct the resource name
            $name = $secretManager->secretVersionName($projectId, $secretId, 'latest');
            echo "Accessing secret: {$secretId} via PHP client\n";
            
            // Create request object properly
            $request = new AccessSecretVersionRequest();
            $request->setName($name);
            
            $response = $secretManager->accessSecretVersion($request);
            $payload = $response->getPayload();
            $value = $payload->getData();
            
            // Convert binary data to string
            $stringValue = (string) $value;
            $stringValue = trim($stringValue);
            
            if (empty($stringValue)) {
                throw new Exception("Secret value is empty for {$secretId}");
            }
            
            echo "Retrieved secret via PHP client, length: " . strlen($stringValue) . "\n";
            return $stringValue;
        } catch (Exception $e) {
            echo "PHP client failed for {$secretId}: " . $e->getMessage() . "\n";
            
            // Fallback to gcloud command
            echo "Trying gcloud command fallback...\n";
            $command = "gcloud secrets versions access latest --secret=" . escapeshellarg($secretId) . " --project=" . escapeshellarg($projectId) . " 2>/dev/null";
            $output = shell_exec($command);
            
            if ($output === null || trim($output) === '') {
                throw new Exception("Failed to retrieve secret {$secretId} via both PHP client and gcloud command");
            }
            
            $stringValue = trim($output);
            echo "Retrieved secret via gcloud command, length: " . strlen($stringValue) . "\n";
            return $stringValue;
        }
    };

    // Retrieve credentials
    $username = $getSecret('TEBRA_USERNAME');
    $password = $getSecret('TEBRA_PASSWORD');
    $customerKey = $getSecret('TEBRA_CUSTOMER_KEY');

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