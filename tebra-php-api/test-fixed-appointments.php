<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables
if (file_exists(__DIR__ . '/.env')) {
    $envVars = parse_ini_file(__DIR__ . '/.env');
    foreach ($envVars as $key => $value) {
        putenv("$key=$value");
    }
}

use LuknerLumina\TebraApi\TebraHttpClient;

echo "=== Testing FIXED GetAppointments ===\n\n";

try {
    $client = new TebraHttpClient();
    echo "✓ Client initialized\n\n";
    
    // Test with today's appointments
    $today = date('Y-m-d');
    
    echo "Testing appointments for today: $today\n";
    $result = $client->getAppointments($today, $today);
    
    if ($result['success']) {
        echo "✅ SUCCESS! GetAppointments is now working!\n";
        
        // Check if we have appointment data
        if (isset($result['data']->Appointments)) {
            $appointments = $result['data']->Appointments;
            if (is_array($appointments)) {
                echo "Found " . count($appointments) . " appointments\n";
                foreach ($appointments as $appt) {
                    echo "- " . ($appt->PatientFullName ?? 'Unknown') . " at " . ($appt->StartDate ?? 'Unknown time') . "\n";
                }
            } else if (is_object($appointments)) {
                echo "Found 1 appointment\n";
                echo "- " . ($appointments->PatientFullName ?? 'Unknown') . " at " . ($appointments->StartDate ?? 'Unknown time') . "\n";
            }
        } else {
            echo "No appointments found for today\n";
        }
    } else {
        echo "❌ Failed: " . $result['message'] . "\n";
    }
    
    // Test with user's date (June 16, 2025)
    echo "\n\nTesting appointments for June 16, 2025:\n";
    $result = $client->getAppointments('2025-06-16', '2025-06-16');
    
    if ($result['success']) {
        echo "✅ SUCCESS for future date!\n";
    } else {
        echo "❌ Failed: " . $result['message'] . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test complete ===\n";