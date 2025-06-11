<?php

$TEBRA_USERNAME = 'work-flow@luknerclinic.com';
$TEBRA_PASSWORD = 'Y2ISY-x@mf1B4renpKHV3w49';
$TEBRA_CUSTKEY = 'j57wt68dc39q';
$TEBRA_WSDL = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';

echo "📅 Testing UTC format for June 10, 2025...\n\n";

try {
    $client = new SoapClient($TEBRA_WSDL, array(
        'trace' => 1,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE
    ));

    // Test UTC format
    $startUtc = date('c', strtotime('2025-06-10 00:00:00'));
    $endUtc = date('c', strtotime('2025-06-10 23:59:59'));
    
    echo "StartDate UTC: $startUtc\n";
    echo "EndDate UTC: $endUtc\n\n";

    $appointmentRequest = array(
        'RequestHeader' => array(
            'User' => $TEBRA_USERNAME,
            'Password' => $TEBRA_PASSWORD,
            'CustomerKey' => $TEBRA_CUSTKEY
        ),
        'Filter' => array(
            'StartDate' => $startUtc,
            'EndDate' => $endUtc,
            'PracticeID' => '1'
        ),
        'Fields' => array(
            'ID' => true,
            'PatientID' => true,
            'PatientFullName' => true,
            'StartDate' => true,
            'AppointmentReason1' => true
        )
    );
    
    $response = $client->GetAppointments(array('request' => $appointmentRequest));
    
    if (isset($response->GetAppointmentsResult->ErrorResponse) && 
        $response->GetAppointmentsResult->ErrorResponse->IsError) {
        echo "❌ Error: " . $response->GetAppointmentsResult->ErrorResponse->ErrorMessage . "\n";
    } else {
        $appointments = $response->GetAppointmentsResult->Appointments ?? null;
        if ($appointments && isset($appointments->AppointmentData)) {
            $appointmentData = $appointments->AppointmentData;
            $count = is_array($appointmentData) ? count($appointmentData) : 1;
            echo "✅ Found $count appointment(s) using UTC format\n\n";
        } else {
            echo "⚪ No appointments found using UTC format\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>