<?php
/**
 * Test HTTP-based Tebra API connection
 */

require_once 'TebraHttpClient.php';
require_once 'config.php';

echo "Testing Tebra API Connection via HTTP...\n";

try {
    $config = getTebraConfig();
    
    echo "Configuration loaded:\n";
    echo "Base URL: " . str_replace('?wsdl', '', $config['wsdl_url']) . "\n";
    echo "Username: " . $config['username'] . "\n";
    echo "Password: " . (empty($config['password']) ? 'NOT SET' : '[SET]') . "\n";
    echo "Customer Key: " . (empty($config['customer_key']) ? 'NOT SET' : '[SET]') . "\n";
    echo "\n";
    
    $client = new TebraHttpClient(
        $config['wsdl_url'],
        $config['username'],
        $config['password'],
        $config['customer_key']
    );
    
    echo "Testing connection...\n";
    $result = $client->testConnection();
    
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";
    
    if ($result['success']) {
        echo "\n✅ SUCCESS: Tebra API HTTP connection working!\n";
        
        // Test getting appointments
        echo "\nTesting appointments endpoint...\n";
        $appointments = $client->getAppointments('2025-06-12', '2025-06-13');
        echo "Appointments result: " . json_encode($appointments, JSON_PRETTY_PRINT) . "\n";
        
    } else {
        echo "\n❌ FAILED: " . $result['message'] . "\n";
    }
    
} catch (Exception $e) {
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

?>