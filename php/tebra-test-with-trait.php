<?php

namespace App\Tests;

require_once __DIR__ . '/vendor/autoload.php';

use App\Traits\SecretManagerTrait;
use SoapClient;
use SoapFault;
use Exception;

/**
 * Tebra API Test Script using Google Secret Manager
 */
class TebraApiTest
{
    use SecretManagerTrait;
    
    private string $wsdl = "https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl";
    
    public function run(): void
    {
        echo "=== Tebra API Test (PHP with Google Secret Manager) ===\n";
        
        try {
            // Initialize Secret Manager
            $this->initializeSecretManager();
            
            echo "Retrieving credentials from Secret Manager...\n";
            
            // Get credentials from GSM
            $credentials = $this->getSecrets([
                'username' => 'TEBRA_USERNAME',
                'password' => 'TEBRA_PASSWORD',
                'customerKey' => 'TEBRA_CUSTOMER_KEY'
            ]);
            
            echo "Credentials retrieved successfully.\n";
            echo "WSDL: {$this->wsdl}\n";
            echo "User: " . $this->maskString($credentials['username']) . "\n";
            echo "Customer Key: " . $this->maskString($credentials['customerKey']) . "\n\n";
            
            // Create SOAP client
            $client = $this->createSoapClient($credentials['username'], $credentials['password']);
            echo "SOAP client created successfully.\n";
            
            // Test GetProviders operation
            echo "Testing GetProviders operation...\n";
            $result = $this->callGetProviders($client, $credentials);
            
            echo "SUCCESS! Response received:\n";
            print_r($result);
            
        } catch (Exception $e) {
            echo "ERROR: " . $e->getMessage() . "\n";
            if (isset($client)) {
                $this->printDebugInfo($client);
            }
        } finally {
            $this->closeSecretManager();
        }
    }
    
    /**
     * Create SOAP client with credentials
     */
    private function createSoapClient(string $username, string $password): SoapClient
    {
        $options = [
            'trace' => 1,
            'exceptions' => 1,
            'login' => $username,
            'password' => $password,
            'cache_wsdl' => WSDL_CACHE_NONE,
            'stream_context' => stream_context_create([
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                ]
            ])
        ];
        
        return new SoapClient($this->wsdl, $options);
    }
    
    /**
     * Call GetProviders operation
     */
    private function callGetProviders(SoapClient $client, array $credentials)
    {
        $request = [
            'request' => [
                'RequestHeader' => [
                    'User' => $credentials['username'],
                    'Password' => $credentials['password'],
                    'CustomerKey' => $credentials['customerKey']
                ]
            ]
        ];
        
        echo "Request structure prepared (credentials hidden).\n\n";
        echo "Sending SOAP request...\n";
        
        return $client->GetProviders($request);
    }
    
    /**
     * Mask sensitive string for display
     */
    private function maskString(string $value): string
    {
        $visibleChars = min(3, floor(strlen($value) * 0.2));
        return substr($value, 0, $visibleChars) . str_repeat('*', strlen($value) - $visibleChars);
    }
    
    /**
     * Print debug information from SOAP client
     */
    private function printDebugInfo(SoapClient $client): void
    {
        echo "\nLast Request:\n" . $client->__getLastRequest() . "\n";
        echo "\nLast Response:\n" . $client->__getLastResponse() . "\n";
    }
}

// Run the test
$test = new TebraApiTest();
$test->run();