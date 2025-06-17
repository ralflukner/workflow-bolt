<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use LuknerLumina\TebraApi\TebraHttpClient;

/**
 * Simple test for appointments using the public API
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "=== Testing GetAppointments with Public API ===\n\n";

try {
    // Initialize client
    $client = new TebraHttpClient();
    echo "✓ Client initialized successfully\n\n";
    
    // Test 1: Get appointments for today
    echo "Test 1: Get appointments for today\n";
    
    try {
        $response = $client->getAppointments();
        echo "✓ Success! Response:\n";
        print_r($response);
    } catch (Exception $e) {
        echo "✗ Error: " . $e->getMessage() . "\n";
    }
    
    echo "\n" . str_repeat("=", 60) . "\n\n";
    
    // Test 2: With specific date range
    echo "Test 2: With specific date range\n";
    
    try {
        $response = $client->getAppointments('6/15/2025', '6/15/2025');
        echo "✓ Success! Response:\n";
        print_r($response);
    } catch (Exception $e) {
        echo "✗ Error: " . $e->getMessage() . "\n";
    }
    
    echo "\n" . str_repeat("=", 60) . "\n\n";
    
    // Test 3: Compare with working getPatients structure
    echo "Test 3: For comparison - working getPatients call\n";
    
    try {
        $patientsResult = $client->getPatients('3/4/2012');
        echo "✓ getPatients works! Structure for reference:\n";
        if (isset($patientsResult['data']->ErrorResponse)) {
            echo "ErrorResponse: ";
            print_r($patientsResult['data']->ErrorResponse);
        } else {
            echo "Success - no error response\n";
        }
    } catch (Exception $e) {
        echo "✗ getPatients failed: " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n=== Testing complete ===\n";