<?php
/**
 * Test just the comparison function logic
 */

/**
 * Compare real Tebra API data with hardcoded expected data
 */
function compareAppointmentData($realData, $hardcodedData) {
    $results = [
        'timestamp' => date('c'),
        'match_status' => 'unknown',
        'details' => []
    ];
    
    try {
        // Extract appointment arrays from both datasets
        $realAppointments = [];
        $hardcodedAppointments = $hardcodedData['data']['GetAppointmentsResult']['Appointments']['AppointmentData'] ?? [];
        
        // Handle real data structure variations
        if (isset($realData['GetAppointmentsResult']['Appointments']['AppointmentData'])) {
            $realAppointments = $realData['GetAppointmentsResult']['Appointments']['AppointmentData'];
        } elseif (isset($realData['data']['GetAppointmentsResult']['Appointments']['AppointmentData'])) {
            $realAppointments = $realData['data']['GetAppointmentsResult']['Appointments']['AppointmentData'];
        }
        
        // Ensure arrays
        if (!is_array($realAppointments)) {
            $realAppointments = $realAppointments ? [$realAppointments] : [];
        }
        if (!is_array($hardcodedAppointments)) {
            $hardcodedAppointments = $hardcodedAppointments ? [$hardcodedAppointments] : [];
        }
        
        $results['real_count'] = count($realAppointments);
        $results['hardcoded_count'] = count($hardcodedAppointments);
        $results['count_match'] = ($results['real_count'] === $results['hardcoded_count']);
        
        // Compare patient names (key identifier)
        $realPatients = array_map(function($appt) {
            return $appt['PatientFullName'] ?? $appt->PatientFullName ?? 'Unknown';
        }, $realAppointments);
        
        $hardcodedPatients = array_map(function($appt) {
            return $appt['PatientFullName'] ?? 'Unknown';
        }, $hardcodedAppointments);
        
        $results['real_patients'] = $realPatients;
        $results['hardcoded_patients'] = $hardcodedPatients;
        
        // Sort arrays for comparison
        $realPatientsSorted = $realPatients;
        $hardcodedPatientsSorted = $hardcodedPatients;
        sort($realPatientsSorted);
        sort($hardcodedPatientsSorted);
        $results['patients_match'] = ($realPatientsSorted === $hardcodedPatientsSorted);
        
        // Overall match assessment
        if ($results['count_match'] && $results['patients_match']) {
            $results['match_status'] = 'full_match';
        } elseif ($results['count_match']) {
            $results['match_status'] = 'count_match_only';
        } else {
            $results['match_status'] = 'no_match';
        }
        
        $results['details'] = [
            'real_data_structure' => array_keys($realData),
            'comparison_successful' => true
        ];
        
    } catch (\Exception $e) {
        $results['match_status'] = 'comparison_error';
        $results['error'] = $e->getMessage();
        $results['details'] = [
            'comparison_successful' => false,
            'error_details' => $e->getTraceAsString()
        ];
    }
    
    return $results;
}

echo "=== Testing PHP API Comparison Function ===\n\n";

// Mock real data (matching hardcoded data)
$mockRealDataMatching = [
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

echo "Test 1: Matching Data\n";
$results1 = compareAppointmentData($mockRealDataMatching, $mockHardcodedData);
echo "  Match Status: {$results1['match_status']}\n";
echo "  Real Count: {$results1['real_count']}\n";
echo "  Hardcoded Count: {$results1['hardcoded_count']}\n";
echo "  Count Match: " . ($results1['count_match'] ? 'YES' : 'NO') . "\n";
echo "  Patients Match: " . ($results1['patients_match'] ? 'YES' : 'NO') . "\n\n";

// Test with different data
$mockRealDataDifferent = [
    'GetAppointmentsResult' => [
        'Appointments' => [
            'AppointmentData' => [
                [
                    'PatientFullName' => 'DIFFERENT PATIENT',
                    'StartTime' => '2025-06-23T09:00:00',
                    'Status' => 'Confirmed'
                ]
            ]
        ]
    ]
];

echo "Test 2: Different Data\n";
$results2 = compareAppointmentData($mockRealDataDifferent, $mockHardcodedData);
echo "  Match Status: {$results2['match_status']}\n";
echo "  Real Count: {$results2['real_count']}\n";
echo "  Hardcoded Count: {$results2['hardcoded_count']}\n";
echo "  Count Match: " . ($results2['count_match'] ? 'YES' : 'NO') . "\n";
echo "  Patients Match: " . ($results2['patients_match'] ? 'YES' : 'NO') . "\n\n";

echo "✅ Comparison function tests completed\n";
?>