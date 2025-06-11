<?php

$TEBRA_USERNAME = 'work-flow@luknerclinic.com';
$TEBRA_PASSWORD = 'Y2ISY-x@mf1B4renpKHV3w49';
$TEBRA_CUSTKEY = 'j57wt68dc39q';
$TEBRA_WSDL = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';

echo "🔍 TESTING MINIMAL VARIATIONS - Finding the exact difference...\n\n";

function testAppointments($client, $name, $request) {
    echo "Testing: $name\n";
    echo "Request: " . json_encode($request, JSON_PRETTY_PRINT) . "\n";
    
    $params = array('request' => $request);
    $response = $client->GetAppointments($params);
    
    $requestXML = $client->__getLastRequest();
    echo "SOAP XML Length: " . strlen($requestXML) . " bytes\n";
    
    if (isset($response->GetAppointmentsResult->ErrorResponse) && 
        $response->GetAppointmentsResult->ErrorResponse->IsError) {
        echo "❌ Error: " . $response->GetAppointmentsResult->ErrorResponse->ErrorMessage . "\n";
    } else {
        $appointments = $response->GetAppointmentsResult->Appointments ?? null;
        if ($appointments && isset($appointments->AppointmentData)) {
            $appointmentData = $appointments->AppointmentData;
            $count = is_array($appointmentData) ? count($appointmentData) : 1;
            echo "✅ Found $count appointment(s)\n";
        } else {
            echo "⚪ No appointments found\n";
        }
    }
    echo str_repeat("-", 80) . "\n\n";
}

try {
    $client = new SoapClient($TEBRA_WSDL, array(
        'trace' => 1,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE
    ));

    $baseHeader = array(
        'User' => $TEBRA_USERNAME,
        'Password' => $TEBRA_PASSWORD,
        'CustomerKey' => $TEBRA_CUSTKEY
    );

    $baseFilter = array(
        'StartDate' => '6/10/2025 8:00:00 AM',
        'EndDate' => '6/10/2025 5:00:00 PM'
    );

    // Test 1: Absolute minimal (what we know works)
    testAppointments($client, "MINIMAL WORKING", array(
        'RequestHeader' => $baseHeader,
        'Filter' => $baseFilter
    ));

    // Test 2: Add basic fields (what proxy uses)
    testAppointments($client, "WITH BASIC FIELDS", array(
        'RequestHeader' => $baseHeader,
        'Filter' => $baseFilter,
        'Fields' => array(
            'ID' => true,
            'PatientID' => true,
            'PatientFullName' => true,
            'StartDate' => true
        )
    ));

    // Test 3: Add all fields (exactly what proxy uses)
    testAppointments($client, "WITH ALL FIELDS (PROXY STYLE)", array(
        'RequestHeader' => $baseHeader,
        'Filter' => $baseFilter,
        'Fields' => array(
            'ID' => true,
            'CreatedDate' => true,
            'LastModifiedDate' => true,
            'PracticeName' => true,
            'Type' => true,
            'PatientID' => true,
            'PatientFullName' => true,
            'StartDate' => true,
            'EndDate' => true,
            'AppointmentReason1' => true,
            'Notes' => true,
            'PracticeID' => true,
            'ServiceLocationName' => true,
            'ResourceName1' => true,
            'ConfirmationStatus' => true,
            'AllDay' => true,
            'Recurring' => true
        )
    ));

    // Test 4: Minimal with different User-Agent (environment simulation)
    $client2 = new SoapClient($TEBRA_WSDL, array(
        'trace' => 1,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE,
        'user_agent' => 'LuknerClinic-TebraProxy/1.0 (HIPAA-Compliant)'
    ));
    
    testAppointments($client2, "MINIMAL WITH PROXY USER AGENT", array(
        'RequestHeader' => $baseHeader,
        'Filter' => $baseFilter
    ));

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>