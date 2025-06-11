<?php

/**
 * Test Tebra Appointments with proper 60-day limit
 */

$TEBRA_USERNAME = 'work-flow@luknerclinic.com';
$TEBRA_PASSWORD = 'Y2ISY-x@mf1B4renpKHV3w49';
$TEBRA_CUSTKEY = 'j57wt68dc39q';
$TEBRA_WSDL = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';

echo "📅 Testing Tebra Appointments with 60-day limit...\n\n";

try {
    $client = new SoapClient($TEBRA_WSDL, array(
        'trace' => 1,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE
    ));

    // Test different date ranges within 60-day limit
    $dateRanges = [
        ['6/1/2025', '6/30/2025', 'June 2025'],
        ['5/1/2025', '6/10/2025', 'May-June 2025'],
        ['4/1/2025', '5/30/2025', 'April-May 2025'],
        ['3/1/2025', '4/29/2025', 'March-April 2025'],
        ['2/1/2025', '3/31/2025', 'Feb-March 2025'],
        ['1/1/2025', '2/28/2025', 'Jan-Feb 2025'],
        ['12/1/2024', '12/31/2024', 'December 2024'],
        ['11/1/2024', '12/30/2024', 'Nov-Dec 2024']
    ];

    foreach ($dateRanges as [$startDate, $endDate, $description]) {
        echo "🔍 Testing date range: $description ($startDate to $endDate)\n";
        
        $appointmentRequest = array(
            'RequestHeader' => array(
                'User' => $TEBRA_USERNAME,
                'Password' => $TEBRA_PASSWORD,
                'CustomerKey' => $TEBRA_CUSTKEY
            ),
            'Filter' => array(
                'StartDate' => $startDate . ' 12:00:00 AM',
                'EndDate' => $endDate . ' 11:59:59 PM',
                'PracticeID' => '1',
                'TimeZoneOffsetFromGMT' => '-6'
            ),
            'Fields' => array(
                'ID' => true,
                'CreatedDate' => true,
                'PracticeName' => true,
                'PatientID' => true,
                'PatientFullName' => true,
                'StartDate' => true,
                'EndDate' => true,
                'AppointmentReason1' => true,
                'PracticeID' => true,
                'Type' => true
            )
        );
        
        $response = $client->GetAppointments(array('request' => $appointmentRequest));
        
        if (isset($response->GetAppointmentsResult->ErrorResponse) && 
            $response->GetAppointmentsResult->ErrorResponse->IsError) {
            echo "  ❌ Error: " . $response->GetAppointmentsResult->ErrorResponse->ErrorMessage . "\n";
        } else {
            $appointments = $response->GetAppointmentsResult->Appointments ?? null;
            if ($appointments && isset($appointments->AppointmentData)) {
                $appointmentData = $appointments->AppointmentData;
                $count = is_array($appointmentData) ? count($appointmentData) : 1;
                echo "  ✅ Found $count appointment(s)\n";
                
                // Show first appointment details
                $firstAppt = is_array($appointmentData) ? $appointmentData[0] : $appointmentData;
                echo "     Patient: " . ($firstAppt->PatientFullName ?? 'Unknown') . "\n";
                echo "     Date: " . ($firstAppt->StartDate ?? 'Unknown') . "\n";
                echo "     Reason: " . ($firstAppt->AppointmentReason1 ?? 'Unknown') . "\n";
                echo "     ID: " . ($firstAppt->ID ?? 'Unknown') . "\n\n";
            } else {
                echo "  ⚪ No appointments found\n";
            }
        }
        
        // Small delay to be nice to the API
        usleep(500000); // 0.5 seconds
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "🏁 Appointment search completed!\n";
?>