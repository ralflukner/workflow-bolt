<?php

/**
 * Direct Tebra SOAP API Test - Debugging Appointments
 */

// Configuration from your environment
$TEBRA_USERNAME = 'work-flow@luknerclinic.com';
$TEBRA_PASSWORD = 'Y2ISY-x@mf1B4renpKHV3w49';
$TEBRA_CUSTKEY = 'j57wt68dc39q';
$TEBRA_WSDL = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';

echo "🧪 Testing Tebra SOAP API directly...\n";
echo "WSDL: $TEBRA_WSDL\n";
echo "Username: $TEBRA_USERNAME\n\n";

try {
    // Create SOAP client
    echo "📡 Creating SOAP client...\n";
    $client = new SoapClient($TEBRA_WSDL, array(
        'trace' => 1,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE,
        'connection_timeout' => 30
    ));
    echo "✅ SOAP client created successfully\n\n";

    // Test 1: Get Practices
    echo "🏥 Testing GetPractices...\n";
    $practiceRequest = array(
        'RequestHeader' => array(
            'User' => $TEBRA_USERNAME,
            'Password' => $TEBRA_PASSWORD,
            'CustomerKey' => $TEBRA_CUSTKEY
        )
    );
    
    $practiceResponse = $client->GetPractices(array('request' => $practiceRequest));
    echo "Practices Response:\n";
    print_r($practiceResponse);
    echo "\n" . str_repeat("-", 80) . "\n\n";

    // Test 2: Get Providers
    echo "👨‍⚕️ Testing GetProviders...\n";
    $providerResponse = $client->GetProviders(array('request' => $practiceRequest));
    echo "Providers Response:\n";
    print_r($providerResponse);
    echo "\n" . str_repeat("-", 80) . "\n\n";

    // Test 3: Get Appointments with minimal filters
    echo "📅 Testing GetAppointments (minimal filters)...\n";
    $appointmentRequest = array(
        'RequestHeader' => array(
            'User' => $TEBRA_USERNAME,
            'Password' => $TEBRA_PASSWORD,
            'CustomerKey' => $TEBRA_CUSTKEY
        ),
        'Filter' => array(
            'StartDate' => '1/1/2024 12:00:00 AM',
            'EndDate' => '12/31/2025 11:59:59 PM'
        )
    );
    
    $appointmentResponse = $client->GetAppointments(array('request' => $appointmentRequest));
    echo "Appointments Response (minimal):\n";
    print_r($appointmentResponse);
    echo "\n" . str_repeat("-", 80) . "\n\n";

    // Test 4: Get Appointments with Practice ID filter
    echo "📅 Testing GetAppointments (with PracticeID)...\n";
    $appointmentRequest2 = array(
        'RequestHeader' => array(
            'User' => $TEBRA_USERNAME,
            'Password' => $TEBRA_PASSWORD,
            'CustomerKey' => $TEBRA_CUSTKEY
        ),
        'Filter' => array(
            'StartDate' => '1/1/2024 12:00:00 AM',
            'EndDate' => '12/31/2025 11:59:59 PM',
            'PracticeID' => '1'
        )
    );
    
    $appointmentResponse2 = $client->GetAppointments(array('request' => $appointmentRequest2));
    echo "Appointments Response (with PracticeID):\n";
    print_r($appointmentResponse2);
    echo "\n" . str_repeat("-", 80) . "\n\n";

    // Test 5: Get Appointments with all filters
    echo "📅 Testing GetAppointments (full filters)...\n";
    $appointmentRequest3 = array(
        'RequestHeader' => array(
            'User' => $TEBRA_USERNAME,
            'Password' => $TEBRA_PASSWORD,
            'CustomerKey' => $TEBRA_CUSTKEY
        ),
        'Filter' => array(
            'StartDate' => '1/1/2024 12:00:00 AM',
            'EndDate' => '12/31/2025 11:59:59 PM',
            'PracticeID' => '1',
            'PracticeName' => 'Lukner Medical Clinic',
            'TimeZoneOffsetFromGMT' => '-6',
            'Type' => 'Patient'
        ),
        'Fields' => array(
            'ID' => true,
            'CreatedDate' => true,
            'PracticeName' => true,
            'Type' => true,
            'PatientID' => true,
            'PatientFullName' => true,
            'StartDate' => true,
            'EndDate' => true,
            'AppointmentReason1' => true,
            'Notes' => true,
            'PracticeID' => true
        )
    );
    
    $appointmentResponse3 = $client->GetAppointments(array('request' => $appointmentRequest3));
    echo "Appointments Response (full filters):\n";
    print_r($appointmentResponse3);
    echo "\n" . str_repeat("-", 80) . "\n\n";

    // Test 6: Check for any errors in the responses
    echo "🔍 Checking for errors...\n";
    
    if (isset($appointmentResponse3->GetAppointmentsResult->ErrorResponse)) {
        echo "❌ Error found in response:\n";
        print_r($appointmentResponse3->GetAppointmentsResult->ErrorResponse);
    } else {
        echo "✅ No errors in response structure\n";
    }
    
    if (isset($appointmentResponse3->GetAppointmentsResult->Appointments)) {
        $appointments = $appointmentResponse3->GetAppointmentsResult->Appointments;
        echo "📊 Appointments structure:\n";
        print_r($appointments);
        
        if (isset($appointments->AppointmentData)) {
            $appointmentData = $appointments->AppointmentData;
            if (is_array($appointmentData)) {
                echo "✅ Found " . count($appointmentData) . " appointments\n";
            } else {
                echo "✅ Found 1 appointment (single object)\n";
            }
        } else {
            echo "❌ No AppointmentData found\n";
        }
    } else {
        echo "❌ No Appointments structure found\n";
    }

} catch (SoapFault $fault) {
    echo "❌ SOAP Fault: " . $fault->faultstring . "\n";
    echo "Detail: " . print_r($fault->detail, true) . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n🏁 Test completed!\n";
?>