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

/**
 * Test script specifically for Tebra's ISO format: YYYY-MM-DDThh:mm:ss:Z
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

echo "{$blue}=== Tebra API ISO Format Test (YYYY-MM-DDThh:mm:ss:Z) ==={$reset}\n\n";

try {
    // Initialize client
    $client = new TebraHttpClient();
    echo "{$green}✓ Client initialized successfully{$reset}\n\n";
    
    // Helper function to format date in Tebra's ISO format
    function formatDateForTebra($date) {
        // Convert to ISO string and replace Z with :Z
        $isoString = $date->format('Y-m-d\TH:i:s\Z');
        // Add colon before Z as per Tebra's requirement
        return str_replace('Z', ':Z', $isoString);
    }
    
    // Test dates
    $today = new DateTime('now', new DateTimeZone('UTC'));
    $yesterday = clone $today;
    $yesterday->sub(new DateInterval('P1D'));
    $tomorrow = clone $today;
    $tomorrow->add(new DateInterval('P1D'));
    $lastWeek = clone $today;
    $lastWeek->sub(new DateInterval('P7D'));
    
    // Define test cases
    $testCases = [
        [
            'name' => 'Standard ISO format (without colon)',
            'fromDate' => $today->format('Y-m-d\TH:i:s\Z'),
            'toDate' => $today->format('Y-m-d\TH:i:s\Z')
        ],
        [
            'name' => 'Tebra ISO format (with colon before Z)',
            'fromDate' => formatDateForTebra($today),
            'toDate' => formatDateForTebra($today)
        ],
        [
            'name' => 'Date range: Yesterday to Today (Tebra format)',
            'fromDate' => formatDateForTebra($yesterday),
            'toDate' => formatDateForTebra($today)
        ],
        [
            'name' => 'Date range: Last week to Tomorrow (Tebra format)',
            'fromDate' => formatDateForTebra($lastWeek),
            'toDate' => formatDateForTebra($tomorrow)
        ],
        [
            'name' => 'Today only with start/end times (Tebra format)',
            'fromDate' => $today->format('Y-m-d') . 'T00:00:00:Z',
            'toDate' => $today->format('Y-m-d') . 'T23:59:59:Z'
        ],
        [
            'name' => 'June 16, 2025 (user\'s date) in Tebra format',
            'fromDate' => '2025-06-16T00:00:00:Z',
            'toDate' => '2025-06-16T23:59:59:Z'
        ]
    ];
    
    // Test each format
    foreach ($testCases as $index => $test) {
        echo "{$yellow}Test " . ($index + 1) . ": {$test['name']}{$reset}\n";
        echo "  From: {$test['fromDate']}\n";
        echo "  To:   {$test['toDate']}\n";
        
        try {
            // Call getAppointments
            $result = $client->getAppointments($test['fromDate'], $test['toDate']);
            
            if (isset($result['success']) && $result['success']) {
                echo "  {$green}✓ Success!{$reset}\n";
                
                // Check appointment count
                $appointmentCount = 0;
                if (isset($result['data']) && is_array($result['data'])) {
                    $appointmentCount = count($result['data']);
                } elseif (isset($result['appointments']) && is_array($result['appointments'])) {
                    $appointmentCount = count($result['appointments']);
                }
                
                echo "  Found {$appointmentCount} appointment(s)\n";
                
                // Show first appointment if any
                if ($appointmentCount > 0) {
                    $firstAppt = isset($result['data'][0]) ? $result['data'][0] : $result['appointments'][0];
                    echo "  Sample: ";
                    if (isset($firstAppt['AppointmentTime'])) {
                        echo $firstAppt['AppointmentTime'];
                    }
                    if (isset($firstAppt['Status'])) {
                        echo " - " . $firstAppt['Status'];
                    }
                    if (isset($firstAppt['PatientFullName'])) {
                        echo " - " . $firstAppt['PatientFullName'];
                    }
                    echo "\n";
                }
            } else {
                $message = isset($result['message']) ? $result['message'] : 'Unknown error';
                echo "  {$red}✗ Failed: {$message}{$reset}\n";
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
        
        // Small delay to avoid rate limiting
        usleep(500000); // 0.5 seconds
    }
    
    // Test the actual SOAP XML structure
    echo "\n{$blue}=== Testing Raw SOAP Request Structure ==={$reset}\n";
    
    // Get SOAP client via reflection to inspect the actual XML
    $reflection = new ReflectionClass($client);
    $clientProperty = $reflection->getProperty('client');
    $clientProperty->setAccessible(true);
    $soapClient = $clientProperty->getValue($client);
    
    // Enable tracing to see the actual XML
    $soapClient->__setOptions(['trace' => 1]);
    
    echo "Testing with Tebra ISO format for today...\n";
    $fromDate = formatDateForTebra($today);
    $toDate = formatDateForTebra($today);
    
    try {
        // Make the call
        $authMethod = $reflection->getMethod('createAuthHeader');
        $authMethod->setAccessible(true);
        $authHeader = $authMethod->invoke($client);
        
        $params = [
            'request' => [
                'RequestHeader' => $authHeader,
                'Filter' => [
                    'StartDate' => $fromDate,
                    'EndDate' => $toDate
                ],
                'Fields' => []
            ]
        ];
        
        echo "Request parameters:\n";
        echo json_encode($params, JSON_PRETTY_PRINT) . "\n\n";
        
        $response = $soapClient->GetAppointments($params);
        
        // Get the actual SOAP request
        $lastRequest = $soapClient->__getLastRequest();
        if ($lastRequest) {
            echo "Actual SOAP XML Request:\n";
            // Pretty print the XML
            $dom = new DOMDocument();
            $dom->preserveWhiteSpace = false;
            $dom->formatOutput = true;
            if (@$dom->loadXML($lastRequest)) {
                echo $dom->saveXML();
            } else {
                echo $lastRequest;
            }
            echo "\n";
        }
        
        echo "{$green}✓ Request successful{$reset}\n";
        
    } catch (Exception $e) {
        echo "{$red}✗ Error: " . $e->getMessage() . "{$reset}\n";
        
        // Try to get the request even on error
        $lastRequest = $soapClient->__getLastRequest();
        if ($lastRequest) {
            echo "\nActual SOAP XML Request (on error):\n";
            $dom = new DOMDocument();
            $dom->preserveWhiteSpace = false;
            $dom->formatOutput = true;
            if (@$dom->loadXML($lastRequest)) {
                echo $dom->saveXML();
            } else {
                echo $lastRequest;
            }
            echo "\n";
        }
    }
    
} catch (Exception $e) {
    echo "{$red}Fatal error: " . $e->getMessage() . "{$reset}\n";
    exit(1);
}

echo "\n{$blue}=== Test complete ==={$reset}\n";