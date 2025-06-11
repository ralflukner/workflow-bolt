<?php

$TEBRA_USERNAME = 'work-flow@luknerclinic.com';
$TEBRA_PASSWORD = 'Y2ISY-x@mf1B4renpKHV3w49';
$TEBRA_CUSTKEY = 'j57wt68dc39q';
$TEBRA_WSDL = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';

echo "🔍 LOCAL TEST - Capturing raw SOAP XML for June 10, 2025...\n\n";

try {
    $client = new SoapClient($TEBRA_WSDL, array(
        'trace' => 1,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE,
        'connection_timeout' => 30,
        'user_agent' => 'LuknerClinic-Local-Debug/1.0'
    ));

    // Use EXACT same parameters as proxy
    $fromDate = '2025-06-10';
    $toDate = '2025-06-10';
    
    $request = array(
        'RequestHeader' => array(
            'User' => $TEBRA_USERNAME,
            'Password' => $TEBRA_PASSWORD,
            'CustomerKey' => $TEBRA_CUSTKEY
        ),
        'Filter' => array(
            'StartDate' => date('n/j/Y', strtotime($fromDate)) . ' 8:00:00 AM',
            'EndDate' => date('n/j/Y', strtotime($toDate)) . ' 5:00:00 PM'
        ),
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
    );
    
    $params = array('request' => $request);
    
    echo "📋 Request parameters:\n";
    echo json_encode($request, JSON_PRETTY_PRINT) . "\n\n";
    
    $response = $client->GetAppointments($params);
    
    // Capture raw SOAP XML
    $lastRequestXML = $client->__getLastRequest();
    $lastResponseXML = $client->__getLastResponse();
    
    echo "📤 RAW SOAP REQUEST XML:\n";
    echo "Length: " . strlen($lastRequestXML) . " bytes\n";
    echo str_repeat("=", 80) . "\n";
    echo $lastRequestXML . "\n";
    echo str_repeat("=", 80) . "\n\n";
    
    echo "📥 RAW SOAP RESPONSE XML:\n";
    echo "Length: " . strlen($lastResponseXML) . " bytes\n";
    echo str_repeat("=", 80) . "\n";
    echo substr($lastResponseXML, 0, 2000) . "\n"; // First 2000 chars
    if (strlen($lastResponseXML) > 2000) {
        echo "... (truncated, full length: " . strlen($lastResponseXML) . " bytes)\n";
    }
    echo str_repeat("=", 80) . "\n\n";
    
    // Check for appointments
    if (isset($response->GetAppointmentsResult->ErrorResponse) && 
        $response->GetAppointmentsResult->ErrorResponse->IsError) {
        echo "❌ Error: " . $response->GetAppointmentsResult->ErrorResponse->ErrorMessage . "\n";
    } else {
        $appointments = $response->GetAppointmentsResult->Appointments ?? null;
        if ($appointments && isset($appointments->AppointmentData)) {
            $appointmentData = $appointments->AppointmentData;
            $count = is_array($appointmentData) ? count($appointmentData) : 1;
            echo "✅ LOCAL SUCCESS: Found $count appointment(s)\n";
        } else {
            echo "⚪ LOCAL: No appointments found\n";
        }
    }
    
    // Save XML for comparison
    file_put_contents('/tmp/local_soap_request.xml', $lastRequestXML);
    file_put_contents('/tmp/local_soap_response.xml', $lastResponseXML);
    echo "\n💾 XML saved to /tmp/local_soap_*.xml for comparison\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>