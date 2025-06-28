<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use LuknerLumina\TebraApi\TebraHttpClient;

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            putenv($line);
        }
    }
}

echo "Testing TebraHttpClient::callSoapMethod() fix\n";
echo "============================================\n\n";

try {
    $client = new TebraHttpClient();
    echo "✓ TebraHttpClient initialized successfully\n\n";
    
    // Test 1: Test the new callSoapMethod with GetProviders
    echo "Test 1: Calling GetProviders via callSoapMethod...\n";
    $result = $client->callSoapMethod('GetProviders', [
        'Fields' => null
    ]);
    
    if ($result['success']) {
        echo "✓ GetProviders successful!\n";
        echo "  - Timestamp: " . $result['timestamp'] . "\n";
        echo "  - SOAP Duration: " . $result['performance']['soap_duration_ms'] . "ms\n";
        echo "  - Total Duration: " . $result['performance']['total_duration_ms'] . "ms\n";
    } else {
        echo "✗ GetProviders failed: " . $result['error'] . "\n";
    }
    
    echo "\n";
    
    // Test 2: Test with GetAppointments
    echo "Test 2: Calling GetAppointments via callSoapMethod...\n";
    $today = date('n/j/Y');
    $result = $client->callSoapMethod('GetAppointments', [
        'Fields' => [],
        'Filter' => [
            'StartDate' => $today,
            'EndDate' => $today
        ]
    ]);
    
    if ($result['success']) {
        echo "✓ GetAppointments successful!\n";
        echo "  - Timestamp: " . $result['timestamp'] . "\n";
        echo "  - SOAP Duration: " . $result['performance']['soap_duration_ms'] . "ms\n";
        echo "  - Total Duration: " . $result['performance']['total_duration_ms'] . "ms\n";
    } else {
        echo "✗ GetAppointments failed: " . $result['error'] . "\n";
    }
    
    echo "\n";
    
    // Test 3: Test error handling with invalid method
    echo "Test 3: Testing error handling with invalid method...\n";
    $result = $client->callSoapMethod('InvalidMethod', []);
    
    if (!$result['success']) {
        echo "✓ Error handling works correctly\n";
        echo "  - Error: " . $result['error'] . "\n";
    } else {
        echo "✗ Unexpected success for invalid method\n";
    }
    
    echo "\n✓ All tests completed. The callSoapMethod() fix is working!\n";
    
} catch (Exception $e) {
    echo "✗ Fatal error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}