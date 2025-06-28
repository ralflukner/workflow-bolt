<?php
/**
 * Test the hardcoded PHP API response locally
 */

// Simulate the API endpoint logic locally
$fromDate = '2025-06-23';
$toDate = '2025-06-23';

echo "=== Testing Hardcoded PHP API Response ===\n";
echo "Date: Monday, June 23, 2025\n";
echo "From: $fromDate\n";
echo "To: $toDate\n\n";

// HARDCODED MOCK RESPONSE - Same as in api.php
$responseData = [
    'success' => true,
    'data' => [
        'GetAppointmentsResult' => [
            'SecurityResponse' => [
                'Authenticated' => true,
                'Authorized' => true,
                'SecurityResultSuccess' => true
            ],
            'Appointments' => [
                'AppointmentData' => [
                    [
                        'AppointmentID' => '1001',
                        'StartTime' => '2025-06-23T09:00:00',
                        'EndTime' => '2025-06-23T09:30:00',
                        'Status' => 'Confirmed',
                        'PatientFullName' => 'TONYA LEWIS',
                        'PatientBirthDate' => '1956-04-03',
                        'PatientPhoneNumber' => '(806) 662-6530',
                        'ServiceProviderFullName' => 'RALF LUKNER',
                        'AppointmentType' => 'Office Visit',
                        'PracticeLocationName' => 'Lukner Medical Clinic',
                        'InsuranceInfo' => 'INSURANCE 2025',
                        'PatientBalance' => 0.00,
                        'Notes' => ''
                    ],
                    [
                        'AppointmentID' => '1002',
                        'StartTime' => '2025-06-23T09:30:00',
                        'EndTime' => '2025-06-23T10:00:00',
                        'Status' => 'Confirmed',
                        'PatientFullName' => 'ZACHARY LEVILAFAWN KIDD',
                        'PatientBirthDate' => '1985-02-10',
                        'PatientPhoneNumber' => '(806) 664-2609',
                        'ServiceProviderFullName' => 'RALF LUKNER',
                        'AppointmentType' => 'Office Visit',
                        'PracticeLocationName' => 'Lukner Medical Clinic',
                        'InsuranceInfo' => 'INSURANCE JANUARY 2025',
                        'PatientBalance' => 0.00,
                        'Notes' => ''
                    ],
                    // Add more appointments...
                ]
            ]
        ]
    ]
];

$appointments = $responseData['data']['GetAppointmentsResult']['Appointments']['AppointmentData'];
echo "✅ Hardcoded Response Generated\n";
echo "Total Appointments: " . count($appointments) . "\n\n";

echo "First few appointments:\n";
foreach (array_slice($appointments, 0, 5) as $i => $appt) {
    $time = date('g:i A', strtotime($appt['StartTime']));
    echo "  #" . ($i+1) . " $time {$appt['Status']} - {$appt['PatientFullName']}\n";
}

echo "\n✅ Hardcoded API test completed\n";
?>