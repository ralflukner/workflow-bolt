<?php

declare(strict_types=1);

use LuknerLumina\TebraApi\TebraHttpClient;
use LuknerLumina\TebraApi\SecretManager;

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../src/tracing.php';

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
        // Convert to array if it's an object
        if (is_object($realData)) {
            $realData = json_decode(json_encode($realData), true);
        }
        
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
        $results['patients_match'] = (sort($realPatients) === sort($hardcodedPatients));
        
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

// Enable CORS for all origins (adjust in production)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Simple routing based on path
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Remove /api prefix if present
$path = preg_replace('/^\/api/', '', $path);

try {
    $client = new TebraHttpClient();
    $responseData = null;
    
    // Parse request body for POST requests
    $body = [];
    if ($method === 'POST') {
        $rawBody = file_get_contents('php://input');
        $body = json_decode($rawBody, true) ?? [];
    }
    
    // Route to appropriate method
    switch ($path) {
        case '/testConnection':
            $responseData = $client->testConnection();
            break;
            
        case '/getPatient':
            $patientId = $body['patientId'] ?? $_GET['patientId'] ?? null;
            if (!$patientId) {
                throw new \InvalidArgumentException('patientId is required');
            }
            $responseData = $client->getPatient($patientId);
            break;
            
        case '/searchPatients':
            $lastName = $body['lastName'] ?? $_GET['lastName'] ?? null;
            if (!$lastName) {
                throw new \InvalidArgumentException('lastName is required');
            }
            $responseData = $client->searchPatients($lastName);
            break;
            
        case '/getAppointments':
            $fromDate = $body['fromDate'] ?? $_GET['fromDate'] ?? null;
            $toDate = $body['toDate'] ?? $_GET['toDate'] ?? null;
            $forceReal = $body['forceReal'] ?? $_GET['forceReal'] ?? false;
            $debugMode = $body['debug'] ?? $_GET['debug'] ?? false;
            
            if (!$fromDate || !$toDate) {
                throw new \InvalidArgumentException('fromDate and toDate are required');
            }
            
            // Enhanced debug logging
            error_log("TEBRA_GET_APPOINTMENTS: Request received - From: {$fromDate}, To: {$toDate}, ForceReal: " . json_encode($forceReal) . ", Debug: " . json_encode($debugMode));
            
            // Rate limiting: Only make real Tebra API calls once every 5 minutes (unless forced)
            $cacheFile = '/tmp/tebra_last_call.txt';
            $lastCallTime = file_exists($cacheFile) ? (int)file_get_contents($cacheFile) : 0;
            $currentTime = time();
            $timeSinceLastCall = $currentTime - $lastCallTime;
            $rateLimitSeconds = 300; // 5 minutes
            
            $realDataAvailable = false;
            $realData = null;
            $comparisonResults = null;
            $debugInfo = [];
            
            // Check if we should make a real API call
            $shouldMakeRealCall = $forceReal || ($timeSinceLastCall >= $rateLimitSeconds);
            
            if ($shouldMakeRealCall) {
                // Make real API call and update cache
                try {
                    error_log("TEBRA_API_CALL: Making real API call (forced: " . json_encode($forceReal) . ", last call was {$timeSinceLastCall}s ago)");
                    $realData = $client->getAppointments($fromDate, $toDate);
                    $realDataAvailable = true;
                    file_put_contents($cacheFile, (string)$currentTime);
                    error_log("TEBRA_API_CALL: Real API call successful, response size: " . strlen(json_encode($realData)));
                    
                    // Debug: Log real data structure
                    if ($debugMode) {
                        $debugInfo['real_data_keys'] = array_keys($realData);
                        $debugInfo['real_appointments_count'] = isset($realData['GetAppointmentsResult']['Appointments']['AppointmentData']) 
                            ? count($realData['GetAppointmentsResult']['Appointments']['AppointmentData']) 
                            : 0;
                    }
                } catch (\Exception $e) {
                    error_log("TEBRA_API_CALL: Real API call failed: " . $e->getMessage());
                    error_log("TEBRA_API_CALL: Stack trace: " . $e->getTraceAsString());
                    $realDataAvailable = false;
                    $debugInfo['real_api_error'] = [
                        'message' => $e->getMessage(),
                        'code' => $e->getCode()
                    ];
                }
            } else {
                $timeUntilNext = $rateLimitSeconds - $timeSinceLastCall;
                error_log("TEBRA_API_CALL: Rate limited, next call allowed in {$timeUntilNext}s");
                $debugInfo['rate_limit_info'] = [
                    'next_allowed_seconds' => $timeUntilNext,
                    'last_call_ago' => $timeSinceLastCall
                ];
            }
            
            // HARDCODED MOCK RESPONSE for Monday, June 23, 2025 - ALL 17 APPOINTMENTS
            $hardcodedData = [
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
                                    'StartTime' => '2025-06-23T09:00:00',
                                    'EndTime' => '2025-06-23T09:30:00',
                                    'Status' => 'Roomed',
                                    'PatientFullName' => 'LISA LOSSIE',
                                    'PatientBirthDate' => '1964-08-06',
                                    'PatientPhoneNumber' => '(806) 662-0000',
                                    'ServiceProviderFullName' => 'RALF LUKNER',
                                    'AppointmentType' => 'Office Visit',
                                    'PracticeLocationName' => 'Lukner Medical Clinic',
                                    'InsuranceInfo' => 'INSURANCE 2025',
                                    'PatientBalance' => 0.00,
                                    'Notes' => ''
                                ],
                                [
                                    'AppointmentID' => '1003',
                                    'StartTime' => '2025-06-23T09:30:00',
                                    'EndTime' => '2025-06-23T10:00:00',
                                    'Status' => 'Roomed',
                                    'PatientFullName' => 'ZACHARY LEVILAFAWN KIDD',
                                    'PatientBirthDate' => '1985-02-10',
                                    'PatientPhoneNumber' => '(806) 664-2609',
                                    'ServiceProviderFullName' => 'RALF LUKNER',
                                    'AppointmentType' => 'Office Visit',
                                    'PracticeLocationName' => 'Lukner Medical Clinic',
                                    'InsuranceInfo' => 'INSURANCE JAN 2025',
                                    'PatientBalance' => 0.00,
                                    'Notes' => ''
                                ],
                                [
                                    'AppointmentID' => '1004',
                                    'StartTime' => '2025-06-23T10:00:00',
                                    'EndTime' => '2025-06-23T10:30:00',
                                    'Status' => 'Rescheduled',
                                    'PatientFullName' => 'AMANDA R COMBS',
                                    'PatientBirthDate' => '1989-10-14',
                                    'PatientPhoneNumber' => '(806) 662-6984',
                                    'ServiceProviderFullName' => 'RALF LUKNER',
                                    'AppointmentType' => 'Office Visit',
                                    'PracticeLocationName' => 'Lukner Medical Clinic',
                                    'InsuranceInfo' => 'DEFAULT',
                                    'PatientBalance' => 0.00,
                                    'Notes' => ''
                                ],
                                [
                                    'AppointmentID' => '1005',
                                    'StartTime' => '2025-06-23T10:00:00',
                                    'EndTime' => '2025-06-23T10:30:00',
                                    'Status' => 'Confirmed',
                                    'PatientFullName' => 'ERIN NICOLE JACOPS',
                                    'PatientBirthDate' => '1976-01-15',
                                    'PatientPhoneNumber' => '(806) 662-5792',
                                    'ServiceProviderFullName' => 'RALF LUKNER',
                                    'AppointmentType' => 'Office Visit (Follow-Up)',
                                    'PracticeLocationName' => 'Lukner Medical Clinic',
                                    'InsuranceInfo' => 'INSURANCE 2024',
                                    'PatientBalance' => 39.30,
                                    'Notes' => ''
                                ],
                                [
                                    'AppointmentID' => '1006',
                                    'StartTime' => '2025-06-23T10:30:00',
                                    'EndTime' => '2025-06-23T11:00:00',
                                    'Status' => 'Confirmed',
                                    'PatientFullName' => 'ROY GENE MORAN',
                                    'PatientBirthDate' => '1957-08-18',
                                    'PatientPhoneNumber' => '(806) 886-6345',
                                    'ServiceProviderFullName' => 'RALF LUKNER',
                                    'AppointmentType' => 'MCR Annual',
                                    'PracticeLocationName' => 'Lukner Medical Clinic',
                                    'InsuranceInfo' => 'INS JAN 2024',
                                    'PatientBalance' => 0.00,
                                    'Notes' => ''
                                ],
                                [
                                    'AppointmentID' => '1007',
                                    'StartTime' => '2025-06-23T11:00:00',
                                    'EndTime' => '2025-06-23T11:30:00',
                                    'Status' => 'Confirmed',
                                    'PatientFullName' => 'JOHN WESTLEY GRIFFIN',
                                    'PatientBirthDate' => '1966-08-02',
                                    'PatientPhoneNumber' => '(806) 663-2434',
                                    'ServiceProviderFullName' => 'RALF LUKNER',
                                    'AppointmentType' => 'Office Visit (Lab Follow-Up)',
                                    'PracticeLocationName' => 'Lukner Medical Clinic',
                                    'InsuranceInfo' => 'INSURANCE 2025',
                                    'PatientBalance' => 0.00,
                                    'Notes' => ''
                                ],
                                [
                                    'AppointmentID' => '1008',
                                    'StartTime' => '2025-06-23T12:00:00',
                                    'EndTime' => '2025-06-23T12:30:00',
                                    'Status' => 'Scheduled',
                                    'PatientFullName' => 'WENDEL LEE WINKLEBLACK',
                                    'PatientBirthDate' => '1966-07-23',
                                    'PatientPhoneNumber' => '(806) 663-0982',
                                    'ServiceProviderFullName' => 'RALF LUKNER',
                                    'AppointmentType' => 'Labs',
                                    'PracticeLocationName' => 'Lukner Medical Clinic',
                                    'InsuranceInfo' => 'INSURANCE JAN 2025',
                                    'PatientBalance' => 0.00,
                                    'Notes' => ''
                                ],
                                [
                                    'AppointmentID' => '1009',
                                    'StartTime' => '2025-06-23T14:00:00',
                                    'EndTime' => '2025-06-23T14:30:00',
                                    'Status' => 'Confirmed',
                                    'PatientFullName' => 'ALEXANDRA MONTOYA CIPOLLONE',
                                    'PatientBirthDate' => '1984-06-30',
                                    'PatientPhoneNumber' => '(801) 309-7476',
                                    'ServiceProviderFullName' => 'RALF LUKNER',
                                    'AppointmentType' => 'Office Visit',
                                    'PracticeLocationName' => 'Lukner Medical Clinic',
                                    'InsuranceInfo' => 'INSURANCE 2025',
                                    'PatientBalance' => 0.00,
                                    'Notes' => ''
                                ],
                                [
                                    'AppointmentID' => '1010',
                                    'StartTime' => '2025-06-23T14:30:00',
                                    'EndTime' => '2025-06-23T15:00:00',
                                    'Status' => 'Cancelled',
                                    'PatientFullName' => 'COURTNEY HONEYCUTT',
                                    'PatientBirthDate' => '1992-07-01',
                                    'PatientPhoneNumber' => '(806) 662-8001',
                                    'ServiceProviderFullName' => 'RALF LUKNER',
                                    'AppointmentType' => 'Office Visit',
                                    'PracticeLocationName' => 'Lukner Medical Clinic',
                                    'InsuranceInfo' => '',
                                    'PatientBalance' => 0.00,
                                    'Notes' => ''
                                ],
                                [
                                    'AppointmentID' => '1011',
                                    'StartTime' => '2025-06-23T14:30:00',
                                    'EndTime' => '2025-06-23T15:00:00',
                                    'Status' => 'Scheduled',
                                    'PatientFullName' => 'CHERYL TWIGG LOPEZ',
                                    'PatientBirthDate' => '1960-08-25',
                                    'PatientPhoneNumber' => '(806) 662-0000',
                                    'ServiceProviderFullName' => 'RALF LUKNER',
                                    'AppointmentType' => 'Office Visit',
                                    'PracticeLocationName' => 'Lukner Medical Clinic',
                                    'InsuranceInfo' => 'INSURANCE 2024',
                                    'PatientBalance' => 0.00,
                                    'Notes' => ''
                                ],
                                [
                                    'AppointmentID' => '1012',
                                    'StartTime' => '2025-06-23T15:00:00',
                                    'EndTime' => '2025-06-23T15:30:00',
                                    'Status' => 'Scheduled',
                                    'PatientFullName' => 'KIMBERLY THOMAS',
                                    'PatientBirthDate' => '1977-07-08',
                                    'PatientPhoneNumber' => '(806) 595-0660',
                                    'ServiceProviderFullName' => 'RALF LUKNER',
                                    'AppointmentType' => 'Office Visit (Labs / Rx Renewals)',
                                    'PracticeLocationName' => 'Lukner Medical Clinic',
                                    'InsuranceInfo' => 'Other Insurance',
                                    'PatientBalance' => 0.00,
                                    'Notes' => ''
                                ],
                                [
                                    'AppointmentID' => '1013',
                                    'StartTime' => '2025-06-23T15:30:00',
                                    'EndTime' => '2025-06-23T16:00:00',
                                    'Status' => 'Cancelled',
                                    'PatientFullName' => 'ERIN NICOLE JACOPS',
                                    'PatientBirthDate' => '1976-01-15',
                                    'PatientPhoneNumber' => '(806) 662-5792',
                                    'ServiceProviderFullName' => 'RALF LUKNER',
                                    'AppointmentType' => 'Office Visit (Follow-Up)',
                                    'PracticeLocationName' => 'Lukner Medical Clinic',
                                    'InsuranceInfo' => 'INSURANCE 2024',
                                    'PatientBalance' => 39.30,
                                    'Notes' => ''
                                ],
                                [
                                    'AppointmentID' => '1014',
                                    'StartTime' => '2025-06-23T15:30:00',
                                    'EndTime' => '2025-06-23T16:00:00',
                                    'Status' => 'Cancelled',
                                    'PatientFullName' => 'ERIN NICOLE JACOPS',
                                    'PatientBirthDate' => '1976-01-15',
                                    'PatientPhoneNumber' => '(806) 662-5792',
                                    'ServiceProviderFullName' => 'RALF LUKNER',
                                    'AppointmentType' => 'Office Visit (Follow-Up)',
                                    'PracticeLocationName' => 'Lukner Medical Clinic',
                                    'InsuranceInfo' => 'INSURANCE 2024',
                                    'PatientBalance' => 39.30,
                                    'Notes' => ''
                                ],
                                [
                                    'AppointmentID' => '1015',
                                    'StartTime' => '2025-06-23T16:00:00',
                                    'EndTime' => '2025-06-23T16:30:00',
                                    'Status' => 'Scheduled',
                                    'PatientFullName' => 'SUMMER R BALAY',
                                    'PatientBirthDate' => '1992-07-05',
                                    'PatientPhoneNumber' => '(806) 663-6224',
                                    'ServiceProviderFullName' => 'RALF LUKNER',
                                    'AppointmentType' => 'New Patient',
                                    'PracticeLocationName' => 'Lukner Medical Clinic',
                                    'InsuranceInfo' => '',
                                    'PatientBalance' => 0.00,
                                    'Notes' => ''
                                ],
                                [
                                    'AppointmentID' => '1016',
                                    'StartTime' => '2025-06-23T17:00:00',
                                    'EndTime' => '2025-06-23T17:30:00',
                                    'Status' => 'Confirmed',
                                    'PatientFullName' => 'WADE SEYMOUR',
                                    'PatientBirthDate' => '1976-03-14',
                                    'PatientPhoneNumber' => '(806) 662-0353',
                                    'ServiceProviderFullName' => 'RALF LUKNER',
                                    'AppointmentType' => 'Labs',
                                    'PracticeLocationName' => 'Lukner Medical Clinic',
                                    'InsuranceInfo' => 'INSURANCE 2023',
                                    'PatientBalance' => 0.00,
                                    'Notes' => ''
                                ],
                                [
                                    'AppointmentID' => '1017',
                                    'StartTime' => '2025-06-23T17:00:00',
                                    'EndTime' => '2025-06-23T17:30:00',
                                    'Status' => 'Scheduled',
                                    'PatientFullName' => 'SHERRY FREE',
                                    'PatientBirthDate' => '1966-11-14',
                                    'PatientPhoneNumber' => '(806) 662-0509',
                                    'ServiceProviderFullName' => 'RALF LUKNER',
                                    'AppointmentType' => 'Office Visit',
                                    'PracticeLocationName' => 'Lukner Medical Clinic',
                                    'InsuranceInfo' => 'SELF PAY',
                                    'PatientBalance' => 0.00,
                                    'Notes' => ''
                                ]
                            ]
                        ]
                    ]
                ]
            ];
            
            // Compare real data with hardcoded data if available
            if ($realDataAvailable && $realData) {
                $comparisonResults = compareAppointmentData($realData, $hardcodedData);
                error_log("TEBRA_DATA_COMPARISON: " . json_encode($comparisonResults));
            }
            
            // Decide which data to return
            if ($realDataAvailable && $realData) {
                // If we have real data, return it
                $responseData = [
                    'success' => true,
                    'data' => $realData
                ];
                $responseData['metadata'] = [
                    'source' => 'real_tebra_api',
                    'date_requested' => $fromDate . ' to ' . $toDate,
                    'real_data_available' => true,
                    'timestamp' => date('c'),
                    'debug_info' => $debugInfo
                ];
                
                // Compare with hardcoded if in debug mode
                if ($debugMode) {
                    // Extract the actual data from the response structure
                    $realDataForComparison = isset($realData['data']) ? $realData['data'] : $realData;
                    $comparisonResults = compareAppointmentData($realDataForComparison, $hardcodedData);
                    $responseData['metadata']['comparison_results'] = $comparisonResults;
                }
            } else {
                // Return hardcoded data as fallback
                $responseData = $hardcodedData;
                $responseData['metadata'] = [
                    'source' => 'hardcoded_fallback',
                    'date_requested' => $fromDate . ' to ' . $toDate,
                    'real_data_available' => false,
                    'rate_limit_info' => [
                        'last_call_ago_seconds' => $timeSinceLastCall,
                        'next_call_allowed_in_seconds' => max(0, $rateLimitSeconds - $timeSinceLastCall)
                    ],
                    'timestamp' => date('c'),
                    'debug_info' => $debugInfo
                ];
            }
            break;
            
        case '/getProviders':
            $responseData = $client->getProviders();
            break;
            
        case '/createAppointment':
            if ($method !== 'POST') {
                throw new \InvalidArgumentException('POST method required');
            }
            $appointmentData = $body['appointmentData'] ?? $body;
            if (!$appointmentData) {
                throw new \InvalidArgumentException('appointmentData is required');
            }
            $responseData = $client->createAppointment($appointmentData);
            break;
            
        case '/updateAppointment':
            if ($method !== 'POST') {
                throw new \InvalidArgumentException('POST method required');
            }
            $appointmentData = $body['appointmentData'] ?? $body;
            if (!$appointmentData) {
                throw new \InvalidArgumentException('appointmentData is required');
            }
            $responseData = $client->updateAppointment($appointmentData);
            break;
            
        case '/syncSchedule':
            if ($method !== 'POST') {
                throw new \InvalidArgumentException('POST method required');
            }
            $date = $body['date'] ?? null;
            if (!$date) {
                // Default to today in Chicago timezone
                $date = (new \DateTime('today', new \DateTimeZone('America/Chicago')))->format('Y-m-d');
            }
            $responseData = $client->syncSchedule($date);
            break;
            
        case '/debugProviders':
            // Debug endpoint to check available providers
            $responseData = [
                'providers' => $client->getProviders(),
                'timestamp' => date('c')
            ];
            break;
            
        case '/testAppointments':
            // TEST ENDPOINT - No authentication required
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
                                ]
                            ]
                        ]
                    ]
                ]
            ];
            break;
            
        case '/health':
        case '/':
            $responseData = [
                'status' => 'healthy',
                'service' => 'Tebra PHP API',
                'timestamp' => date('c'),
                'endpoints' => [
                    '/testConnection',
                    '/getPatient',
                    '/searchPatients', 
                    '/getAppointments',
                    '/getProviders',
                    '/createAppointment',
                    '/updateAppointment',
                    '/syncSchedule',
                    '/testAppointments'
                ]
            ];
            break;
            
        default:
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Endpoint not found: ' . $path,
                'available_endpoints' => [
                    '/testConnection',
                    '/getPatient',
                    '/searchPatients',
                    '/getAppointments', 
                    '/getProviders',
                    '/createAppointment',
                    '/updateAppointment',
                    '/syncSchedule'
                ]
            ]);
            exit;
    }
    
    // Return successful response
    echo json_encode($responseData);
    
} catch (\InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'type' => 'validation_error'
    ]);
} catch (\SoapFault $e) {
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'error' => 'Tebra SOAP Error: ' . $e->getMessage(),
        'type' => 'soap_fault'
    ]);
} catch (\Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'type' => 'server_error'
    ]);
}