<?php
/**
 * Test the comparison and rate limiting logic locally
 */

// Include the comparison function
require_once __DIR__ . '/public/api.php';

echo "=== Testing PHP API Comparison Logic ===\n\n";

// Test 1: Simulate rate limiting
echo "Test 1: Rate Limiting Logic\n";
$cacheFile = '/tmp/tebra_last_call_test.txt';
$currentTime = time();
$rateLimitSeconds = 300; // 5 minutes

// Clear any existing cache
if (file_exists($cacheFile)) {
    unlink($cacheFile);
}

$lastCallTime = file_exists($cacheFile) ? (int)file_get_contents($cacheFile) : 0;
$timeSinceLastCall = $currentTime - $lastCallTime;

echo "  Current time: $currentTime\n";
echo "  Last call time: $lastCallTime\n";
echo "  Time since last call: {$timeSinceLastCall}s\n";
echo "  Rate limit: {$rateLimitSeconds}s\n";
echo "  Should make API call: " . ($timeSinceLastCall >= $rateLimitSeconds ? 'YES' : 'NO') . "\n\n";

// Test 2: Data comparison function
echo "Test 2: Data Comparison Function\n";

// Mock real data (what we'd get from Tebra)
$mockRealData = [
    'GetAppointmentsResult' => [
        'Appointments' => [
            'AppointmentData' => [
                [
                    'PatientFullName' => 'TONYA LEWIS',
                    'StartTime' => '2025-06-23T09:00:00',
                    'Status' => 'Confirmed'
                ],
                [
                    'PatientFullName' => 'ZACHARY LEVILAFAWN KIDD',
                    'StartTime' => '2025-06-23T09:30:00',
                    'Status' => 'Confirmed'
                ]
            ]
        ]
    ]
];

// Mock hardcoded data
$mockHardcodedData = [
    'data' => [
        'GetAppointmentsResult' => [
            'Appointments' => [
                'AppointmentData' => [
                    [
                        'PatientFullName' => 'TONYA LEWIS',
                        'StartTime' => '2025-06-23T09:00:00',
                        'Status' => 'Confirmed'
                    ],
                    [
                        'PatientFullName' => 'ZACHARY LEVILAFAWN KIDD',
                        'StartTime' => '2025-06-23T09:30:00',
                        'Status' => 'Confirmed'
                    ]
                ]
            ]
        ]
    ]
];

$comparisonResults = compareAppointmentData($mockRealData, $mockHardcodedData);

echo "  Comparison Results:\n";
echo "  - Match Status: {$comparisonResults['match_status']}\n";
echo "  - Real Count: {$comparisonResults['real_count']}\n";
echo "  - Hardcoded Count: {$comparisonResults['hardcoded_count']}\n";
echo "  - Count Match: " . ($comparisonResults['count_match'] ? 'YES' : 'NO') . "\n";
echo "  - Patients Match: " . ($comparisonResults['patients_match'] ? 'YES' : 'NO') . "\n";

if (isset($comparisonResults['real_patients'])) {
    echo "  - Real Patients: " . implode(', ', $comparisonResults['real_patients']) . "\n";
    echo "  - Hardcoded Patients: " . implode(', ', $comparisonResults['hardcoded_patients']) . "\n";
}

echo "\n✅ Comparison logic test completed\n";

// Test 3: Simulate cache update
echo "\nTest 3: Cache Update\n";
file_put_contents($cacheFile, (string)$currentTime);
echo "  Cache file updated with timestamp: $currentTime\n";

// Cleanup
unlink($cacheFile);
echo "  Test cache file cleaned up\n";

echo "\n✅ All tests completed successfully\n";
?>