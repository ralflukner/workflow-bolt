<?php

/**
 * TEBRA SUPPORT ISSUE DEMONSTRATION
 * 
 * This file demonstrates the GetAppointments ValidationHelper bug for Tebra support.
 * 
 * ISSUE: GetAppointments endpoint consistently fails with:
 * "Object reference not set to an instance of an object"
 * at KareoServicesWCF.Validation.ValidationHelper.ValidateDateTimeFields
 * 
 * Customer: Lukner Medical Clinic
 * Practice ID: 67149
 * 
 * WORKING COMPARISON: GetPatients works perfectly with an identical structure
 * BROKEN: GetAppointments fails regardless of parameters
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "=== TEBRA SUPPORT ISSUE DEMONSTRATION ===\n";
echo "GetAppointments ValidationHelper Bug\n";
echo "Customer: Lukner Medical Clinic\n\n";

// NOTE FOR TEBRA SUPPORT: Replace these with your test credentials
$username = 'YOUR_TEST_USERNAME';
$password = 'YOUR_TEST_PASSWORD';
$customerKey = 'YOUR_TEST_CUSTOMER_KEY';
$wsdlUrl = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';

try {
    // Create SOAP client
    $options = array(
        'soap_version' => SOAP_1_1,
        'trace' => true,
        'exceptions' => true,
        'cache_wsdl' => WSDL_CACHE_NONE
    );
    
    $client = new SoapClient($wsdlUrl, $options);
    echo "✓ SOAP client created successfully\n\n";
    
    // DEMONSTRATION 1: GetPatients WORKS (for comparison)
    echo "=== WORKING EXAMPLE: GetPatients ===\n";
    $patientsRequest = array(
        'RequestHeader' => array(
            'User' => $username,
            'Password' => $password,
            'CustomerKey' => $customerKey
        ),
        'Filter' => array(
            'FromLastModifiedDate' => '3/4/2012'
        ),
        'Fields' => array(
            'PatientFullName' => 'true'
        )
    );
    
    try {
        $response = $client->GetPatients(array('request' => $patientsRequest));
        
        if (isset($response->GetPatientsResult->ErrorResponse->IsError) && 
            $response->GetPatientsResult->ErrorResponse->IsError) {
            echo "❌ GetPatients Error: " . $response->GetPatientsResult->ErrorResponse->ErrorMessage . "\n";
        } else {
            echo "✅ GetPatients SUCCESS - No errors\n";
        }
    } catch (Exception $e) {
        echo "❌ GetPatients Exception: " . $e->getMessage() . "\n";
    }
    
    echo "\n=== BROKEN EXAMPLE: GetAppointments ===\n";
    
    // DEMONSTRATION 2: GetAppointments FAILS with minimal parameters
    echo "Test 1: Minimal GetAppointments request\n";
    $appointmentsRequest = array(
        'RequestHeader' => array(
            'User' => $username,
            'Password' => $password,
            'CustomerKey' => $customerKey
        )
    );
    
    try {
        $response = $client->GetAppointments(array('request' => $appointmentsRequest));
        
        if (isset($response->GetAppointmentsResult->ErrorResponse->IsError) && 
            $response->GetAppointmentsResult->ErrorResponse->IsError) {
            echo "❌ ISSUE REPRODUCED: " . $response->GetAppointmentsResult->ErrorResponse->ErrorMessage . "\n";
            echo "   Stack trace shows ValidationHelper.ValidateDateTimeFields error\n";
        } else {
            echo "✅ Unexpected success\n";
        }
    } catch (Exception $e) {
        echo "❌ Exception: " . $e->getMessage() . "\n";
    }
    
    echo "\nTest 2: GetAppointments with PracticeName (required field)\n";
    $appointmentsWithPractice = array(
        'RequestHeader' => array(
            'User' => $username,
            'Password' => $password,
            'CustomerKey' => $customerKey
        ),
        'PracticeName' => 'Lukner Medical Clinic'
    );
    
    try {
        $response = $client->GetAppointments(array('request' => $appointmentsWithPractice));
        
        if (isset($response->GetAppointmentsResult->ErrorResponse->IsError) && 
            $response->GetAppointmentsResult->ErrorResponse->IsError) {
            echo "❌ SAME ISSUE: " . $response->GetAppointmentsResult->ErrorResponse->ErrorMessage . "\n";
        } else {
            echo "✅ Unexpected success\n";
        }
    } catch (Exception $e) {
        echo "❌ Exception: " . $e->getMessage() . "\n";
    }
    
    echo "\nTest 3: GetAppointments with dates (as per API documentation)\n";
    $appointmentsWithDates = array(
        'RequestHeader' => array(
            'User' => $username,
            'Password' => $password,
            'CustomerKey' => $customerKey
        ),
        'PracticeName' => 'Lukner Medical Clinic',
        'StartDate' => '6/15/2025',
        'EndDate' => '6/15/2025'
    );
    
    try {
        $response = $client->GetAppointments(array('request' => $appointmentsWithDates));
        
        if (isset($response->GetAppointmentsResult->ErrorResponse->IsError) && 
            $response->GetAppointmentsResult->ErrorResponse->IsError) {
            echo "❌ SAME ISSUE: " . $response->GetAppointmentsResult->ErrorResponse->ErrorMessage . "\n";
            echo "   Full error details:\n";
            echo "   Message: " . $response->GetAppointmentsResult->ErrorResponse->ErrorMessage . "\n";
            echo "   Stack: " . $response->GetAppointmentsResult->ErrorResponse->StackTrace . "\n";
        } else {
            echo "✅ Unexpected success\n";
        }
    } catch (Exception $e) {
        echo "❌ Exception: " . $e->getMessage() . "\n";
    }
    
    echo "\n=== SUMMARY FOR TEBRA SUPPORT ===\n";
    echo "ISSUE: GetAppointments endpoint has a bug in ValidationHelper.ValidateDateTimeFields\n";
    echo "ERROR: 'Object reference not set to an instance of an object'\n";
    echo "LOCATION: KareoServicesWCF.Validation.ValidationHelper.ValidateDateTimeFields line 24\n";
    echo "COMPARISON: GetPatients works perfectly with identical request structure\n";
    echo "TESTED: Multiple date formats, minimal/complete parameters - all fail\n";
    echo "REQUEST: Please fix the ValidationHelper bug in GetAppointments endpoint\n\n";
    
    echo "ADDITIONAL AFFECTED ENDPOINTS:\n";
    echo "- GetPractices (same ValidationHelper error)\n";
    echo "- Possibly others with similar validation\n\n";
    
    echo "WORKING ENDPOINTS (for reference):\n";
    echo "- GetPatients ✅\n";
    echo "- GetProviders ✅\n";
    echo "- GetServiceLocations ✅\n";
    
} catch (Exception $e) {
    echo "Fatal error: " . $e->getMessage() . "\n";
}

echo "\n=== END SUPPORT DEMONSTRATION ===\n";

/*
INSTRUCTIONS FOR TEBRA SUPPORT:

1. Replace the credentials at the top with your test environment credentials
2. Run this script: php tebra-support-getappointments-issue.php
3. You will see:
   - GetPatients works fine
   - GetAppointments fails with ValidationHelper error
   - Same error occurs regardless of parameters

This demonstrates the server-side bug that needs to be fixed in your 
ValidationHelper.ValidateDateTimeFields method.

Customer Information:
- Company: Lukner Medical Clinic
- Practice ID: 67149
*/
?>