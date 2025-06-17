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

/**
 * Safely logs XML by obfuscating sensitive information
 * @param string $xml Raw XML string
 * @param string $type Type of XML (request/response) for logging
 * @return string Sanitized XML
 */
function logXmlSafely($xml, $type = 'XML') {
    if (empty($xml)) {
        return "[$type] No content to display\n";
    }
    
    try {
        // Parse XML
        $dom = new DOMDocument();
        $dom->preserveWhiteSpace = false;
        $dom->formatOutput = true;
        
        if (!$dom->loadXML($xml)) {
            return "[$type] Failed to parse XML - showing raw (potentially unsafe) content\n";
        }
        
        // Create XPath for finding sensitive elements
        $xpath = new DOMXPath($dom);
        
        // Obfuscate sensitive elements - both in request headers and SOAP envelope
        $sensitiveElements = [
            '//User',
            '//Password', 
            '//CustomerKey',
            '//user',
            '//password',
            '//customerKey',
            '//Authorization',
            '//authorization'
        ];
        
        foreach ($sensitiveElements as $element) {
            $nodes = $xpath->query($element);
            foreach ($nodes as $node) {
                $node->nodeValue = '***REDACTED***';
            }
        }
        
        // Also check for HTTP basic auth in headers
        $xml = $dom->saveXML();
        $xml = preg_replace('/Authorization:\s*Basic\s+[A-Za-z0-9+\/=]+/i', 'Authorization: Basic ***REDACTED***', $xml);
        
        return "[$type] Sanitized XML:\n" . $xml . "\n";
        
    } catch (Exception $e) {
        return "[$type] Error parsing XML for sanitization: " . $e->getMessage() . "\n";
    }
}

// Parse command line arguments
$options = getopt('', ['insecure']);
$allowInsecure = isset($options['insecure']);

if ($allowInsecure) {
    echo "⚠️  WARNING: Running in insecure mode - TLS verification disabled!\n";
} else {
    echo "🔒 Running in secure mode - TLS verification enabled\n";
}
echo "\n";

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

    // Configure TLS security - secure by default
    $sslOptions = [];
    if ($allowInsecure) {
        echo "⚠️  Disabling TLS verification (insecure mode)\n";
        $sslOptions = [
            'verify_peer' => false,
            'verify_peer_name' => false,
        ];
    } else {
        echo "🔒 Using secure TLS verification\n";
        // When not specified, PHP defaults to secure settings:
        // verify_peer => true, verify_peer_name => true
    }

    $soapOptions = [
        'trace' => 1,
        'exceptions' => 1,
        'login' => $username,
        'password' => $password,
        'cache_wsdl' => WSDL_CACHE_NONE,
    ];
    
    // Only add stream context if we need to override security settings
    if (!empty($sslOptions)) {
        $soapOptions['stream_context'] = stream_context_create([
            'ssl' => $sslOptions
        ]);
    }

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
        echo logXmlSafely($client->__getLastRequest(), 'SOAP Request');
        echo logXmlSafely($client->__getLastResponse(), 'SOAP Response');
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