<?php
/**
 * Simple test script for Tebra API connection
 */

require_once 'TebraApiClient.php';
require_once 'config.php';

echo "Testing Tebra API Connection...\n";

try {
    $config = getTebraConfig();
    
    echo "Configuration loaded:\n";
    echo "WSDL URL: " . $config['wsdl_url'] . "\n";
    echo "Username: " . $config['username'] . "\n";
    echo "Password: " . (empty($config['password']) ? 'NOT SET' : '[SET]') . "\n";
    echo "Customer Key: " . (empty($config['customer_key']) ? 'NOT SET' : '[SET]') . "\n";
    echo "\n";
    
    $client = new TebraApiClient(
        $config['wsdl_url'],
        $config['username'],
        $config['password'],
        $config['customer_key']
    );
    
    echo "Testing connection...\n";
    $result = $client->testConnection();
    
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";
    
    if ($result['success']) {
        echo "\n✅ SUCCESS: Tebra API connection working!\n";
        
        // Test getting providers
        echo "\nTesting providers endpoint...\n";
        $providers = $client->getProviders();
        echo "Providers result: " . json_encode($providers, JSON_PRETTY_PRINT) . "\n";
        
    } else {
        echo "\n❌ FAILED: " . $result['message'] . "\n";
    }
    
} catch (Exception $e) {
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

?>