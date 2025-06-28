<?php
/**
 * Tebra EHR SOAP API PHP Implementation
 * 
 * Tebra uses SOAP (Simple Object Access Protocol) for their primary API integration.
 * This example demonstrates how to integrate with Tebra's SOAP API for healthcare data exchange.
 * 
 * Requirements:
 * - PHP 7.4+ with SOAP extension enabled
 * - Valid Tebra credentials (Username, Password, Customer Key)
 * - HIPAA-compliant server environment
 * 
 * Note: You'll need to request API access and obtain your Customer Key from Tebra support.
 */

class TebraSOAPAPI {
    private $wsdlUrl;
    private $username;
    private $password;
    private $customerKey;
    private $client;
    private $version;
    
    public function __construct($username, $password, $customerKey, $version = 'v2') {
        $this->username = $username;
        $this->password = $password;
        $this->customerKey = $customerKey;
        $this->version = $version;
        
        // Tebra SOAP API endpoints
        $this->wsdlUrl = "https://api.kareo.com/service/{$version}/kareo/services/KareoServices?wsdl";
        
        $this->initializeClient();
    }
    
    /**
     * Initialize SOAP client with proper configuration
     */
    private function initializeClient() {
        $options = [
            'soap_version' => SOAP_1_1,
            'trace' => true,
            'exceptions' => true,
            'cache_wsdl' => WSDL_CACHE_NONE,
            'features' => SOAP_SINGLE_ELEMENT_ARRAYS,
            'user_agent' => 'TebraSOAP-PHP-Client/1.0',
            'connection_timeout' => 30,
            'stream_context' => stream_context_create([
                'ssl' => [
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                    'allow_self_signed' => false
                ]
            ])
        ];
        
        try {
            $this->client = new SoapClient($this->wsdlUrl, $options);
        } catch (SoapFault $e) {
            throw new Exception("SOAP Client initialization failed: " . $e->getMessage());
        }
    }
    
    /**
     * Create authentication header for all requests
     */
    private function createAuthHeader() {
        return [
            'CustomerKey' => $this->customerKey,
            'Username' => $this->username,
            'Password' => $this->password
        ];
    }
    
    /**
     * Handle SOAP faults and errors
     */
    private function handleSoapFault($e, $method) {
        error_log("SOAP Error in {$method}: " . $e->getMessage());
        throw new Exception("SOAP Error in {$method}: " . $e->getMessage());
    }
    
    /**
     * Get patients with optional filtering
     * Useful for syncing patient data changes
     */
    public function getPatients($fromDate = null, $toDate = null, $patientId = null, $externalId = null) {
        try {
            $params = [
                'request' => array_merge($this->createAuthHeader(), [
                    'FromLastModifiedDate' => $fromDate,
                    'ToLastModifiedDate' => $toDate,
                    'PatientID' => $patientId,
                    'PatientExternalID' => $externalId
                ])
            ];
            
            // Remove null values
            $params['request'] = array_filter($params['request'], function($value) {
                return $value !== null;
            });
            
            $response = $this->client->GetPatients($params);
            return $response;
            
        } catch (SoapFault $e) {
            $this->handleSoapFault($e, 'GetPatients');
        }
    }
    
    /**
     * Get specific patient by ID
     */
    public function getPatient($patientId, $externalId = null) {
        try {
            $params = [
                'request' => array_merge($this->createAuthHeader(), [
                    'PatientID' => $patientId,
                    'PatientExternalID' => $externalId
                ])
            ];
            
            // Remove null values
            $params['request'] = array_filter($params['request'], function($value) {
                return $value !== null;
            });
            
            $response = $this->client->GetPatient($params);
            return $response;
            
        } catch (SoapFault $e) {
            $this->handleSoapFault($e, 'GetPatient');
        }
    }
    
    /**
     * Create a new patient
     */
    public function createPatient($patientData) {
        try {
            $params = [
                'request' => array_merge($this->createAuthHeader(), [
                    'Patient' => $patientData
                ])
            ];
            
            $response = $this->client->CreatePatient($params);
            return $response;
            
        } catch (SoapFault $e) {
            $this->handleSoapFault($e, 'CreatePatient');
        }
    }
    
    /**
     * Update existing patient
     */
    public function modifyPatient($patientData) {
        try {
            $params = [
                'request' => array_merge($this->createAuthHeader(), [
                    'Patient' => $patientData
                ])
            ];
            
            $response = $this->client->ModifyPatient($params);
            return $response;
            
        } catch (SoapFault $e) {
            $this->handleSoapFault($e, 'ModifyPatient');
        }
    }
    
    /**
     * Get appointments within date range
     */
    public function getAppointments($fromDate, $toDate, $patientId = null, $providerId = null) {
        try {
            $params = [
                'request' => array_merge($this->createAuthHeader(), [
                    'FromDate' => $fromDate,
                    'ToDate' => $toDate,
                    'PatientID' => $patientId,
                    'ProviderID' => $providerId
                ])
            ];
            
            // Remove null values
            $params['request'] = array_filter($params['request'], function($value) {
                return $value !== null;
            });
            
            $response = $this->client->GetAppointments($params);
            return $response;
            
        } catch (SoapFault $e) {
            $this->handleSoapFault($e, 'GetAppointments');
        }
    }
    
    /**
     * Create new appointment
     */
    public function createAppointment($appointmentData) {
        try {
            $params = [
                'request' => array_merge($this->createAuthHeader(), [
                    'Appointment' => $appointmentData
                ])
            ];
            
            $response = $this->client->CreateAppointment($params);
            return $response;
            
        } catch (SoapFault $e) {
            $this->handleSoapFault($e, 'CreateAppointment');
        }
    }
    
    /**
     * Get encounters (visits/sessions)
     */
    public function getEncounters($fromDate, $toDate, $patientId = null) {
        try {
            $params = [
                'request' => array_merge($this->createAuthHeader(), [
                    'FromDate' => $fromDate,
                    'ToDate' => $toDate,
                    'PatientID' => $patientId
                ])
            ];
            
            // Remove null values
            $params['request'] = array_filter($params['request'], function($value) {
                return $value !== null;
            });
            
            $response = $this->client->GetEncounters($params);
            return $response;
            
        } catch (SoapFault $e) {
            $this->handleSoapFault($e, 'GetEncounters');
        }
    }
    
    /**
     * Get insurance policies for a patient
     */
    public function getInsurancePolicies($patientId) {
        try {
            $params = [
                'request' => array_merge($this->createAuthHeader(), [
                    'PatientID' => $patientId
                ])
            ];
            
            $response = $this->client->GetInsurancePolicies($params);
            return $response;
            
        } catch (SoapFault $e) {
            $this->handleSoapFault($e, 'GetInsurancePolicies');
        }
    }
    
    /**
     * Get providers in the practice
     */
    public function getProviders() {
        try {
            $params = [
                'request' => $this->createAuthHeader()
            ];
            
            $response = $this->client->GetProviders($params);
            return $response;
            
        } catch (SoapFault $e) {
            $this->handleSoapFault($e, 'GetProviders');
        }
    }
    
    /**
     * Get service locations
     */
    public function getServiceLocations() {
        try {
            $params = [
                'request' => $this->createAuthHeader()
            ];
            
            $response = $this->client->GetServiceLocations($params);
            return $response;
            
        } catch (SoapFault $e) {
            $this->handleSoapFault($e, 'GetServiceLocations');
        }
    }
    
    /**
     * Get available SOAP methods
     */
    public function getAvailableMethods() {
        try {
            return $this->client->__getFunctions();
        } catch (Exception $e) {
            throw new Exception("Error getting available methods: " . $e->getMessage());
        }
    }
    
    /**
     * Get last SOAP request (for debugging)
     */
    public function getLastRequest() {
        return $this->client->__getLastRequest();
    }
    
    /**
     * Get last SOAP response (for debugging)
     */
    public function getLastResponse() {
        return $this->client->__getLastResponse();
    }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

try {
    // Initialize the API client
    $tebraAPI = new TebraSOAPAPI(
        'your_username',      // Your Tebra username
        'your_password',      // Your Tebra password
        'your_customer_key'   // Your Customer Key from Tebra
    );
    
    // Example 1: Get all patients modified in the last 7 days
    $fromDate = date('Y-m-d\TH:i:s', strtotime('-7 days'));
    $toDate = date('Y-m-d\TH:i:s');
    
    echo "Fetching patients modified since: {$fromDate}\n";
    $patients = $tebraAPI->getPatients($fromDate, $toDate);
    
    if (isset($patients->GetPatientsResult->PatientData)) {
        foreach ($patients->GetPatientsResult->PatientData as $patient) {
            echo "Patient: {$patient->FirstName} {$patient->LastName} (ID: {$patient->PatientID})\n";
        }
    }
    
    // Example 2: Get appointments for today
    $today = date('Y-m-d\T00:00:00');
    $endOfDay = date('Y-m-d\T23:59:59');
    
    echo "\nFetching appointments for today:\n";
    $appointments = $tebraAPI->getAppointments($today, $endOfDay);
    
    if (isset($appointments->GetAppointmentsResult->AppointmentData)) {
        foreach ($appointments->GetAppointmentsResult->AppointmentData as $appointment) {
            echo "Appointment: {$appointment->StartTime} - Patient ID: {$appointment->PatientID}\n";
        }
    }
    
    // Example 3: Create a new patient
    $newPatient = [
        'FirstName' => 'John',
        'LastName' => 'Doe',
        'DateofBirth' => '1980-01-15',
        'Gender' => 'M',
        'EmailAddress' => 'john.doe@example.com',
        'HomePhone' => '555-123-4567',
        'Address1' => '123 Main St',
        'City' => 'Dallas',
        'State' => 'TX',
        'ZipCode' => '75201',
        'PatientExternalID' => 'EXT_' . uniqid() // Your system's ID
    ];
    
    echo "\nCreating new patient:\n";
    $createResult = $tebraAPI->createPatient($newPatient);
    
    if (isset($createResult->CreatePatientResult->PatientID)) {
        echo "Patient created successfully. Tebra ID: {$createResult->CreatePatientResult->PatientID}\n";
    }
    
    // Example 4: Get available providers
    echo "\nFetching providers:\n";
    $providers = $tebraAPI->getProviders();
    
    if (isset($providers->GetProvidersResult->ProviderData)) {
        foreach ($providers->GetProvidersResult->ProviderData as $provider) {
            echo "Provider: {$provider->FirstName} {$provider->LastName} (ID: {$provider->ProviderID})\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    
    // For debugging, you can also check the raw SOAP request/response
    if (isset($tebraAPI)) {
        if (getenv('DEBUG_SOAP') === 'true') {
            // Printing full SOAP envelopes can leak PHI; only enable in secure debugging sessions
            echo "\nLast SOAP Request:\n" . $tebraAPI->getLastRequest() . "\n";
            echo "\nLast SOAP Response:\n" . $tebraAPI->getLastResponse() . "\n";
        }
    }
}

// ============================================================================
// HELPER FUNCTIONS FOR COMMON OPERATIONS
// ============================================================================

/**
 * Sync patients modified since last sync
 */
function syncPatients($tebraAPI, $lastSyncTime) {
    $patients = $tebraAPI->getPatients($lastSyncTime);
    
    if (isset($patients->GetPatientsResult->PatientData)) {
        foreach ($patients->GetPatientsResult->PatientData as $patient) {
            // Process each patient record
            // Update your local database here
            echo "Syncing patient: {$patient->FirstName} {$patient->LastName}\n";
        }
    }
    
    return date('Y-m-d\TH:i:s'); // Return new sync timestamp
}

/**
 * Create appointment with error handling
 */
function scheduleAppointment($tebraAPI, $patientId, $providerId, $dateTime, $duration = 30) {
    $appointmentData = [
        'PatientID' => $patientId,
        'ProviderID' => $providerId,
        'StartTime' => $dateTime,
        'EndTime' => date('Y-m-d\TH:i:s', strtotime($dateTime . " +{$duration} minutes")),
        'AppointmentType' => 'Office Visit',
        'Notes' => 'Scheduled via API'
    ];
    
    try {
        $result = $tebraAPI->createAppointment($appointmentData);
        
        if (isset($result->CreateAppointmentResult->AppointmentID)) {
            return $result->CreateAppointmentResult->AppointmentID;
        } else {
            throw new Exception('Failed to create appointment');
        }
        
    } catch (Exception $e) {
        error_log("Appointment creation failed: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Batch process patients with rate limiting
 */
function batchProcessPatients($tebraAPI, $patientIds, $callback, $delayMs = 1000) {
    foreach ($patientIds as $patientId) {
        try {
            $patient = $tebraAPI->getPatient($patientId);
            call_user_func($callback, $patient);
            
            // Rate limiting to avoid overwhelming the API
            usleep($delayMs * 1000);
            
        } catch (Exception $e) {
            error_log("Error processing patient {$patientId}: " . $e->getMessage());
            continue;
        }
    }
}

?>
