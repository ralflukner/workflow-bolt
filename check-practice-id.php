<?php

$TEBRA_USERNAME = 'work-flow@luknerclinic.com';
$TEBRA_PASSWORD = 'Y2ISY-x@mf1B4renpKHV3w49';
$TEBRA_CUSTKEY = 'j57wt68dc39q';
$TEBRA_WSDL = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';

echo "🔍 Checking Practice ID in appointment data...\n\n";

try {
    $client = new SoapClient($TEBRA_WSDL, array(
        'trace' => 1,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE
    ));

    // Test without PracticeID filter to see all practices
    $appointmentRequest = array(
        'RequestHeader' => array(
            'User' => $TEBRA_USERNAME,
            'Password' => $TEBRA_PASSWORD,
            'CustomerKey' => $TEBRA_CUSTKEY
        ),
        'Filter' => array(
            'StartDate' => '6/10/2025 8:00:00 AM',
            'EndDate' => '6/10/2025 5:00:00 PM'
        ),
        'Fields' => array(
            'ID' => true,
            'PatientID' => true,
            'PatientFullName' => true,
            'StartDate' => true,
            'PracticeID' => true,  // Include this to see what practice IDs exist
            'PracticeName' => true
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
            $appts = is_array($appointmentData) ? $appointmentData : [$appointmentData];
            
            echo "📊 Found " . count($appts) . " appointment(s)\n\n";
            
            $practiceIds = [];
            foreach ($appts as $i => $appt) {
                $practiceId = $appt->PracticeID ?? 'Unknown';
                $practiceName = $appt->PracticeName ?? 'Unknown';
                $practiceIds[$practiceId] = $practiceName;
                
                if ($i < 3) { // Show first 3
                    echo "Appointment " . ($i + 1) . ":\n";
                    echo "  PracticeID: $practiceId\n";
                    echo "  PracticeName: $practiceName\n";
                    echo "  Patient: " . ($appt->PatientFullName ?? 'Unknown') . "\n\n";
                }
            }
            
            echo "🏥 Unique Practice IDs found:\n";
            foreach ($practiceIds as $id => $name) {
                echo "  ID: $id - Name: $name\n";
            }
        } else {
            echo "⚪ No appointments found\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>