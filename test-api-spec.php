<?php

$TEBRA_USERNAME = 'work-flow@luknerclinic.com';
$TEBRA_PASSWORD = 'Y2ISY-x@mf1B4renpKHV3w49';
$TEBRA_CUSTKEY = 'j57wt68dc39q';
$TEBRA_WSDL = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';

echo "📅 Testing with API specification format...\n\n";

try {
    $client = new SoapClient($TEBRA_WSDL, array(
        'trace' => 1,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE
    ));

    // Using the API specification parameters
    $appointmentRequest = array(
        'RequestHeader' => array(
            'User' => $TEBRA_USERNAME,
            'Password' => $TEBRA_PASSWORD,
            'CustomerKey' => $TEBRA_CUSTKEY
        ),
        'Filter' => array(
            'StartDate' => '6/10/2025 8:00:00 AM',
            'EndDate' => '6/10/2025 5:00:00 PM',
            'PracticeName' => 'Lukner Medical Clinic',
            'TimeZoneOffsetFromGMT' => '-6'
        ),
        'Fields' => array(
            'ID' => true,
            'PatientID' => true,
            'PatientFullName' => true,
            'StartDate' => true,
            'EndDate' => true,
            'AppointmentReason1' => true,
            'PracticeName' => true,
            'Type' => true
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
            echo "✅ Found $count appointment(s) using API spec format\n\n";
            
            $appts = is_array($appointmentData) ? array_slice($appointmentData, 0, 3) : [$appointmentData];
            foreach ($appts as $i => $appt) {
                echo "Appointment " . ($i + 1) . ":\n";
                echo "  ID: " . ($appt->ID ?? 'Unknown') . "\n";
                echo "  Patient: " . ($appt->PatientFullName ?? 'Unknown') . "\n";
                echo "  Time: " . ($appt->StartDate ?? 'Unknown') . "\n";
                echo "  Reason: " . ($appt->AppointmentReason1 ?? 'Unknown') . "\n\n";
            }
        } else {
            echo "⚪ No appointments found using API spec format\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>