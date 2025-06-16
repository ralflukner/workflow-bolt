<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use LuknerLumina\TebraApi\TebraHttpClient;

/**
 * Test script for Tebra API date format issues
 * Tests getAppointments endpoint with various date formats
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

echo "{$blue}=== Tebra API Date Format Test ==={$reset}\n\n";

try {
    // Initialize client
    $client = new TebraHttpClient();
    echo "{$green}✓ Client initialized successfully{$reset}\n\n";
    
    // Define test date formats
    $dateFormats = [
        // ISO 8601 formats
        [
            'name' => 'ISO 8601 Date Only (YYYY-MM-DD)',
            'fromDate' => '2024-01-01',
            'toDate' => '2024-01-07'
        ],
        [
            'name' => 'ISO 8601 with Time (YYYY-MM-DDTHH:MM:SS)',
            'fromDate' => '2024-01-01T00:00:00',
            'toDate' => '2024-01-07T23:59:59'
        ],
        [
            'name' => 'ISO 8601 with Time and Z (YYYY-MM-DDTHH:MM:SSZ)',
            'fromDate' => '2024-01-01T00:00:00Z',
            'toDate' => '2024-01-07T23:59:59Z'
        ],
        [
            'name' => 'ISO 8601 with Time and Offset (YYYY-MM-DDTHH:MM:SS+00:00)',
            'fromDate' => '2024-01-01T00:00:00+00:00',
            'toDate' => '2024-01-07T23:59:59+00:00'
        ],
        
        // US formats
        [
            'name' => 'US Format (MM/DD/YYYY)',
            'fromDate' => '01/01/2024',
            'toDate' => '01/07/2024'
        ],
        [
            'name' => 'US Format with Time (MM/DD/YYYY HH:MM:SS)',
            'fromDate' => '01/01/2024 00:00:00',
            'toDate' => '01/07/2024 23:59:59'
        ],
        [
            'name' => 'US Format Short Year (MM/DD/YY)',
            'fromDate' => '01/01/24',
            'toDate' => '01/07/24'
        ],
        [
            'name' => 'US Format Single Digit (M/D/YYYY)',
            'fromDate' => '1/1/2024',
            'toDate' => '1/7/2024'
        ],
        
        // European formats
        [
            'name' => 'European Format (DD/MM/YYYY)',
            'fromDate' => '01/01/2024',
            'toDate' => '07/01/2024'
        ],
        [
            'name' => 'European Format with Dots (DD.MM.YYYY)',
            'fromDate' => '01.01.2024',
            'toDate' => '07.01.2024'
        ],
        
        // Other formats
        [
            'name' => 'Long Format (January 1, 2024)',
            'fromDate' => 'January 1, 2024',
            'toDate' => 'January 7, 2024'
        ],
        [
            'name' => 'Short Month Format (Jan 1, 2024)',
            'fromDate' => 'Jan 1, 2024',
            'toDate' => 'Jan 7, 2024'
        ],
        [
            'name' => 'DateTime Object String',
            'fromDate' => (new DateTime('2024-01-01'))->format('c'),
            'toDate' => (new DateTime('2024-01-07'))->format('c')
        ],
        [
            'name' => 'Unix Timestamp',
            'fromDate' => (string)strtotime('2024-01-01'),
            'toDate' => (string)strtotime('2024-01-07')
        ],
        
        // Formats based on Tebra example (from getPatients)
        [
            'name' => 'Tebra Example Format (M/D/YYYY)',
            'fromDate' => '3/4/2012',
            'toDate' => '3/10/2012'
        ],
        [
            'name' => 'Current Date Range (Today - 7 days)',
            'fromDate' => date('n/j/Y', strtotime('-7 days')),
            'toDate' => date('n/j/Y')
        ]
    ];
    
    // Test each date format
    foreach ($dateFormats as $index => $test) {
        echo "{$yellow}Test " . ($index + 1) . ": {$test['name']}{$reset}\n";
        echo "  From: {$test['fromDate']}\n";
        echo "  To:   {$test['toDate']}\n";
        
        try {
            // Create a custom SOAP client to capture the exact request
            $testClient = new class($client) {
                private $realClient;
                
                public function __construct($realClient) {
                    $this->realClient = $realClient;
                }
                
                public function testGetAppointments($fromDate, $toDate) {
                    // Get the actual SOAP client via reflection
                    $reflection = new ReflectionClass($this->realClient);
                    $clientProperty = $reflection->getProperty('client');
                    $clientProperty->setAccessible(true);
                    $soapClient = $clientProperty->getValue($this->realClient);
                    
                    // Get auth header
                    $authMethod = $reflection->getMethod('createAuthHeader');
                    $authMethod->setAccessible(true);
                    $authHeader = $authMethod->invoke($this->realClient);
                    
                    // Build request
                    $params = [
                        'request' => [
                            'RequestHeader' => $authHeader,
                            'FromDate' => $fromDate,
                            'ToDate' => $toDate,
                            'Fields' => null
                        ]
                    ];
                    
                    // Log the exact request structure
                    echo "  Request structure:\n";
                    echo "  " . json_encode($params, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
                    
                    try {
                        $response = $soapClient->GetAppointments($params);
                        
                        // Get actual SOAP request
                        $lastRequest = $soapClient->__getLastRequest();
                        if ($lastRequest) {
                            echo "  SOAP Request (first 500 chars):\n";
                            echo "  " . substr(str_replace("\n", "\n  ", $lastRequest), 0, 500) . "...\n";
                        }
                        
                        return ['success' => true, 'response' => $response];
                    } catch (Exception $e) {
                        // Get actual SOAP request even on error
                        $lastRequest = $soapClient->__getLastRequest();
                        if ($lastRequest) {
                            echo "  SOAP Request on error (first 500 chars):\n";
                            echo "  " . substr(str_replace("\n", "\n  ", $lastRequest), 0, 500) . "...\n";
                        }
                        throw $e;
                    }
                }
            };
            
            $result = $testClient->testGetAppointments($test['fromDate'], $test['toDate']);
            
            echo "  {$green}✓ Success!{$reset}\n";
            
            // Check if we got actual appointments
            if (isset($result['response']->GetAppointmentsResult->Appointments)) {
                $appointments = $result['response']->GetAppointmentsResult->Appointments;
                $count = is_array($appointments) ? count($appointments) : 1;
                echo "  Found {$count} appointment(s)\n";
            }
            
        } catch (SoapFault $e) {
            echo "  {$red}✗ SOAP Fault: " . $e->getMessage() . "{$reset}\n";
            if (isset($e->detail)) {
                echo "  Detail: " . print_r($e->detail, true) . "\n";
            }
        } catch (Exception $e) {
            echo "  {$red}✗ Error: " . $e->getMessage() . "{$reset}\n";
        }
        
        echo "\n";
        
        // Add a small delay between tests to avoid rate limiting
        usleep(500000); // 0.5 seconds
    }
    
    // Test with specific date range that should have appointments
    echo "\n{$blue}=== Testing with specific recent date range ==={$reset}\n";
    $recentTests = [
        [
            'name' => 'Last 30 days (M/D/YYYY format)',
            'fromDate' => date('n/j/Y', strtotime('-30 days')),
            'toDate' => date('n/j/Y')
        ],
        [
            'name' => 'Last 30 days (ISO format)',
            'fromDate' => date('Y-m-d', strtotime('-30 days')),
            'toDate' => date('Y-m-d')
        ],
        [
            'name' => 'Single day (today in M/D/YYYY)',
            'fromDate' => date('n/j/Y'),
            'toDate' => date('n/j/Y')
        ]
    ];
    
    foreach ($recentTests as $test) {
        echo "\n{$yellow}{$test['name']}{$reset}\n";
        echo "  From: {$test['fromDate']}\n";
        echo "  To:   {$test['toDate']}\n";
        
        try {
            $result = $client->getAppointments($test['fromDate'], $test['toDate']);
            
            if ($result['success']) {
                echo "  {$green}✓ Success!{$reset}\n";
            } else {
                echo "  {$red}✗ Failed: {$result['message']}{$reset}\n";
            }
        } catch (Exception $e) {
            echo "  {$red}✗ Error: " . $e->getMessage() . "{$reset}\n";
        }
    }
    
} catch (Exception $e) {
    echo "{$red}Fatal error: " . $e->getMessage() . "{$reset}\n";
    exit(1);
}

echo "\n{$blue}=== Date format testing complete ==={$reset}\n";