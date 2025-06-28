<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use LuknerLumina\TebraApi\TebraHttpClient;

/**
 * Simplified date format test for Tebra API
 * Focuses on the most likely working formats based on the API error
 */

// Enable all error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "=== Tebra API Date Format Test (Simplified) ===\n\n";

try {
    // Initialize client
    $client = new TebraHttpClient();
    echo "✓ Client initialized\n\n";
    
    // First, let's check what methods are available
    echo "Available SOAP methods:\n";
    $methods = $client->getAvailableMethods();
    foreach ($methods as $method) {
        if (strpos($method, 'GetAppointments') !== false) {
            echo "  - $method\n";
        }
    }
    echo "\n";
    
    // Test the most likely date formats based on Tebra documentation
    $tests = [
        // Based on the working getPatients example which uses '3/4/2012'
        [
            'name' => 'US Format without leading zeros (M/D/YYYY) - Like Tebra Example',
            'fromDate' => '1/1/2024',
            'toDate' => '1/7/2024'
        ],
        [
            'name' => 'US Format with leading zeros (MM/DD/YYYY)',
            'fromDate' => '01/01/2024',
            'toDate' => '01/07/2024'
        ],
        [
            'name' => 'ISO Date (YYYY-MM-DD)',
            'fromDate' => '2024-01-01',
            'toDate' => '2024-01-07'
        ],
        [
            'name' => 'DateTime string (from PHP DateTime)',
            'fromDate' => (new DateTime('2024-01-01'))->format('n/j/Y'),
            'toDate' => (new DateTime('2024-01-07'))->format('n/j/Y')
        ],
        [
            'name' => 'Current week (using same format as Tebra example)',
            'fromDate' => date('n/j/Y', strtotime('monday this week')),
            'toDate' => date('n/j/Y', strtotime('sunday this week'))
        ],
        [
            'name' => 'Yesterday to Today',
            'fromDate' => date('n/j/Y', strtotime('yesterday')),
            'toDate' => date('n/j/Y')
        ]
    ];
    
    foreach ($tests as $index => $test) {
        echo "Test " . ($index + 1) . ": {$test['name']}\n";
        echo "  From: {$test['fromDate']}\n";
        echo "  To:   {$test['toDate']}\n";
        
        try {
            // Make the request
            $startTime = microtime(true);
            $result = $client->getAppointments($test['fromDate'], $test['toDate']);
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            if ($result['success']) {
                echo "  ✓ SUCCESS! (took {$duration}ms)\n";
                
                // Try to get the last SOAP request for debugging
                $lastRequest = $client->getLastRequest();
                if ($lastRequest) {
                    // Extract just the date parameters from the SOAP request
                    if (preg_match('/<FromDate>(.*?)<\/FromDate>/', $lastRequest, $fromMatch)) {
                        echo "  Sent FromDate: {$fromMatch[1]}\n";
                    }
                    if (preg_match('/<ToDate>(.*?)<\/ToDate>/', $lastRequest, $toMatch)) {
                        echo "  Sent ToDate: {$toMatch[1]}\n";
                    }
                }
                
                // Check if we got data
                if (isset($result['data']->GetAppointmentsResult)) {
                    $appointmentsResult = $result['data']->GetAppointmentsResult;
                    if (isset($appointmentsResult->Appointments)) {
                        $appointments = $appointmentsResult->Appointments;
                        $count = is_array($appointments) ? count($appointments) : (empty($appointments) ? 0 : 1);
                        echo "  Found {$count} appointment(s)\n";
                    } else {
                        echo "  No appointments found in date range\n";
                    }
                }
            } else {
                echo "  ✗ FAILED: {$result['message']}\n";
            }
            
        } catch (Exception $e) {
            echo "  ✗ ERROR: " . $e->getMessage() . "\n";
            
            // Try to get more details about the error
            $lastResponse = $client->getLastResponse();
            if ($lastResponse && strpos($lastResponse, 'ValidationHelper.ValidateDateTimeFields') !== false) {
                echo "  → This appears to be the date validation error!\n";
                
                // Try to extract more error details
                if (preg_match('/<faultstring>(.*?)<\/faultstring>/s', $lastResponse, $faultMatch)) {
                    echo "  Fault: " . strip_tags($faultMatch[1]) . "\n";
                }
            }
        }
        
        echo "\n";
        sleep(1); // Wait 1 second between tests
    }
    
    // Additional test: Try to match exact format from working getPatients
    echo "\nSpecial Test: Using exact date format pattern from working getPatients method\n";
    echo "The getPatients method uses '3/4/2012' format (single digit month/day)\n\n";
    
    // Create dates in exact format M/D/YYYY with single digits where applicable
    $specialFromDate = '3/1/2024';  // March 1, 2024
    $specialToDate = '3/7/2024';    // March 7, 2024
    
    echo "  From: $specialFromDate\n";
    echo "  To:   $specialToDate\n";
    
    try {
        $result = $client->getAppointments($specialFromDate, $specialToDate);
        if ($result['success']) {
            echo "  ✓ SUCCESS with Tebra example format!\n";
        } else {
            echo "  ✗ Failed: {$result['message']}\n";
        }
    } catch (Exception $e) {
        echo "  ✗ Error: " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n=== Testing complete ===\n";
echo "\nRecommendation: If all tests fail with 'Object reference not set to an instance of an object',\n";
echo "this might indicate:\n";
echo "1. The date format is correct but there's a missing required parameter\n";
echo "2. The API endpoint expects dates in a different structure (e.g., as part of a Filter object)\n";
echo "3. The account might not have permission to access appointments\n";
echo "\nNext steps:\n";
echo "- Check if GetAppointments requires additional parameters beyond dates\n";
echo "- Review the WSDL for the exact parameter structure\n";
echo "- Contact Tebra support with the specific error details\n";