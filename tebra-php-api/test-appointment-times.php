<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use LuknerLumina\TebraApi\TebraHttpClient;

/**
 * Test script specifically for appointment date/time formats
 * Focuses on formats that include time components
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Color codes for terminal output
$red = "\033[0;31m";
$green = "\033[0;32m";
$yellow = "\033[0;33m";
$blue = "\033[0;34m";
$reset = "\033[0m";

echo "{$blue}=== Tebra API Appointment Date/Time Format Test ==={$reset}\n\n";

try {
    // Initialize client
    $client = new TebraHttpClient();
    echo "{$green}✓ Client initialized successfully{$reset}\n\n";
    
    // Define test date/time formats specifically for appointments
    // Using today's date for better chance of finding appointments
    $today = new DateTime();
    $tomorrow = clone $today;
    $tomorrow->add(new DateInterval('P1D'));
    
    $dateTimeFormats = [
        // .NET DateTime formats (likely what Tebra expects)
        [
            'name' => '.NET DateTime 12hr (M/d/yyyy h:mm:ss tt)',
            'fromDate' => $today->format('n/j/Y') . ' 12:00:00 AM',
            'toDate' => $today->format('n/j/Y') . ' 11:59:59 PM'
        ],
        [
            'name' => '.NET DateTime 24hr (M/d/yyyy HH:mm:ss)',
            'fromDate' => $today->format('n/j/Y') . ' 00:00:00',
            'toDate' => $today->format('n/j/Y') . ' 23:59:59'
        ],
        [
            'name' => '.NET DateTime with time (MM/dd/yyyy hh:mm:ss tt)',
            'fromDate' => $today->format('m/d/Y') . ' 12:00:00 AM',
            'toDate' => $today->format('m/d/Y') . ' 11:59:59 PM'
        ],
        
        // ISO 8601 with time components
        [
            'name' => 'ISO 8601 DateTime (YYYY-MM-DDTHH:MM:SS)',
            'fromDate' => $today->format('Y-m-d') . 'T00:00:00',
            'toDate' => $today->format('Y-m-d') . 'T23:59:59'
        ],
        [
            'name' => 'ISO 8601 with milliseconds',
            'fromDate' => $today->format('Y-m-d') . 'T00:00:00.000',
            'toDate' => $today->format('Y-m-d') . 'T23:59:59.999'
        ],
        [
            'name' => 'ISO 8601 with timezone',
            'fromDate' => $today->format('Y-m-d') . 'T00:00:00-05:00',
            'toDate' => $today->format('Y-m-d') . 'T23:59:59-05:00'
        ],
        
        // SQL Server formats
        [
            'name' => 'SQL DateTime (YYYY-MM-DD HH:MM:SS)',
            'fromDate' => $today->format('Y-m-d') . ' 00:00:00',
            'toDate' => $today->format('Y-m-d') . ' 23:59:59'
        ],
        [
            'name' => 'SQL DateTime with milliseconds',
            'fromDate' => $today->format('Y-m-d') . ' 00:00:00.000',
            'toDate' => $today->format('Y-m-d') . ' 23:59:59.999'
        ],
        
        // US formats with various time representations
        [
            'name' => 'US with time (M/D/YYYY H:MM:SS AM/PM)',
            'fromDate' => $today->format('n/j/Y') . ' 12:00:00 AM',
            'toDate' => $today->format('n/j/Y') . ' 11:59:59 PM'
        ],
        [
            'name' => 'US with short time (M/D/YYYY H:MM AM/PM)',
            'fromDate' => $today->format('n/j/Y') . ' 12:00 AM',
            'toDate' => $today->format('n/j/Y') . ' 11:59 PM'
        ],
        
        // Date only formats (for comparison)
        [
            'name' => 'Date only US (M/D/YYYY)',
            'fromDate' => $today->format('n/j/Y'),
            'toDate' => $today->format('n/j/Y')
        ],
        [
            'name' => 'Date only ISO (YYYY-MM-DD)',
            'fromDate' => $today->format('Y-m-d'),
            'toDate' => $today->format('Y-m-d')
        ],
        
        // Multi-day range with times
        [
            'name' => 'Multi-day with time (M/D/YYYY H:MM:SS AM/PM)',
            'fromDate' => $today->format('n/j/Y') . ' 12:00:00 AM',
            'toDate' => $tomorrow->format('n/j/Y') . ' 11:59:59 PM'
        ],
        
        // Testing boundary times
        [
            'name' => 'Start of day to end of day (explicit times)',
            'fromDate' => $today->format('n/j/Y') . ' 00:00:00',
            'toDate' => $today->format('n/j/Y') . ' 23:59:59'
        ],
        [
            'name' => 'Business hours only (8 AM - 6 PM)',
            'fromDate' => $today->format('n/j/Y') . ' 08:00:00',
            'toDate' => $today->format('n/j/Y') . ' 18:00:00'
        ]
    ];
    
    // Run tests
    $successCount = 0;
    $workingFormats = [];
    
    foreach ($dateTimeFormats as $index => $test) {
        echo "{$yellow}Test " . ($index + 1) . ": {$test['name']}{$reset}\n";
        echo "  From: {$test['fromDate']}\n";
        echo "  To:   {$test['toDate']}\n";
        
        try {
            $result = $client->getAppointments($test['fromDate'], $test['toDate']);
            
            // Check the actual response structure
            if (isset($result['data']) && is_object($result['data'])) {
                // Avoid “Undefined property” notice when GetAppointmentsResult is absent
$appointmentsResult = isset($result['data']->GetAppointmentsResult)
    ? $result['data']->GetAppointmentsResult
    : null;
                
                if ($appointmentsResult) {
                    // Check for error in response
                    if (isset($appointmentsResult->ErrorResponse) && $appointmentsResult->ErrorResponse->IsError) {
                        $errorMsg = $appointmentsResult->ErrorResponse->ErrorMessage ?? 'Unknown error';
                        echo "  {$red}✗ Tebra Error: {$errorMsg}{$reset}\n";
                        
                        // If it's the "Object reference" error, show more details
                        if (strpos($errorMsg, 'Object reference') !== false) {
                            echo "  {$yellow}Note: This error suggests the date format might be parsed but missing required fields{$reset}\n";
                        }
                    } else {
                        // Success - check for appointments
                        echo "  {$green}✓ Success! No Tebra errors{$reset}\n";
                        $successCount++;
                        $workingFormats[] = $test['name'];
                        
                        if (isset($appointmentsResult->Appointments)) {
                            $appointments = $appointmentsResult->Appointments;
                            $count = is_array($appointments) ? count($appointments) : (!empty($appointments) ? 1 : 0);
                            echo "  Found {$count} appointment(s)\n";
                        }
                    }
                }
            } else {
                echo "  {$red}✗ Invalid response structure{$reset}\n";
            }
            
        } catch (Exception $e) {
            echo "  {$red}✗ Exception: " . $e->getMessage() . "{$reset}\n";
        }
        
        echo "\n";
        
        // Small delay to avoid rate limiting
        usleep(500000); // 0.5 seconds
    }
    
    // Summary
    echo "\n{$blue}=== Test Summary ==={$reset}\n";
    echo "Total tests: " . count($dateTimeFormats) . "\n";
    echo "Successful: {$green}{$successCount}{$reset}\n";
    echo "Failed: {$red}" . (count($dateTimeFormats) - $successCount) . "{$reset}\n";
    
    if (!empty($workingFormats)) {
        echo "\n{$green}Working formats:{$reset}\n";
        foreach ($workingFormats as $format) {
            echo "  • {$format}\n";
        }
    }
    
    // If all formats fail with the same error, suggest next steps
    if ($successCount === 0) {
        echo "\n{$yellow}Troubleshooting suggestions:{$reset}\n";
        echo "1. The 'Object reference not set' error might indicate:\n";
        echo "   - The date format is being parsed but other required fields are missing\n";
        echo "   - The 'Fields' parameter might need to be specified instead of null\n";
        echo "   - The request structure might need additional parameters\n";
        echo "2. Try examining the working getPatients method for comparison\n";
        echo "3. Check if appointments require specific provider or location context\n";
    }
    
} catch (Exception $e) {
    echo "{$red}Fatal error: " . $e->getMessage() . "{$reset}\n";
    exit(1);
}

echo "\n{$blue}=== Testing complete ==={$reset}\n";