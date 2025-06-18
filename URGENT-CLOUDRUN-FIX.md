# URGENT: Cloud Run PHP Service Fix

## 🚨 Issue Discovered

The enhanced debugging system revealed a **fatal PHP error** in your Cloud Run service:

```
Fatal error: Uncaught Error: Call to undefined method TebraHttpClient::callSoapMethod() 
in /var/www/public/index.php:55
```

## 🔍 Root Cause

The `TebraHttpClient` class is missing the `callSoapMethod()` method that your code is trying to call.

## 🛠️ Immediate Fix Options

### Option 1: Add Missing Method to TebraHttpClient

Add this method to your `TebraHttpClient` class in your Cloud Run PHP code:

```php
class TebraHttpClient {
    // ... existing code ...
    
    public function callSoapMethod($method, $params = []) {
        try {
            // Initialize SOAP client if not already done
            if (!$this->soapClient) {
                $this->initializeSoapClient();
            }
            
            // Call the SOAP method
            $result = $this->soapClient->__soapCall($method, $params);
            
            return [
                'success' => true,
                'data' => $result
            ];
            
        } catch (SoapFault $e) {
            error_log("SOAP Fault: " . $e->getMessage());
            return [
                'success' => false,
                'error' => 'SOAP Fault: ' . $e->getMessage()
            ];
        } catch (Exception $e) {
            error_log("General Error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Error: ' . $e->getMessage()
            ];
        }
    }
    
    private function initializeSoapClient() {
        if (!$this->soapClient) {
            $wsdlUrl = $this->getWsdlUrl();
            $options = [
                'trace' => true,
                'exceptions' => true,
                'cache_wsdl' => WSDL_CACHE_NONE, // Disable caching as mentioned in your fixes
                'compression' => SOAP_COMPRESSION_ACCEPT | SOAP_COMPRESSION_GZIP,
                'connection_timeout' => 30,
                'user_agent' => 'Tebra-Proxy/1.0'
            ];
            
            $this->soapClient = new SoapClient($wsdlUrl, $options);
        }
    }
}
```

### Option 2: Fix Method Call in index.php

If the method should be named differently, update line 55 in `/var/www/public/index.php`:

```php
// Instead of:
$result = $tebraClient->callSoapMethod($action, $params);

// Use the correct method name, for example:
$result = $tebraClient->callMethod($action, $params);
// OR
$result = $tebraClient->makeRequest($action, $params);
// OR
$result = $tebraClient->executeSoapCall($action, $params);
```

## 🚀 Quick Deploy Fix

1. **Update your Cloud Run PHP code** with the missing method
2. **Redeploy the service**:
   ```bash
   gcloud run deploy tebra-php-api \
     --source . \
     --region us-central1 \
     --project luknerlumina-firebase
   ```

3. **Test the fix**:
   ```bash
   node test-debug-logging.cjs
   ```

## 🔍 Verify the Fix

After deploying, the enhanced logging should show:

**Success logs:**

```
[INFO] TebraProxyClient:makeRequest:xxxxx:5 (+XXXms) Request completed successfully
```

**Instead of error logs:**

```
[ERROR] Application error in response { 
  fullResponse: 'Fatal error: Uncaught Error: Call to undefined method...'
}
```

## 📋 Next Steps After Fix

1. **Run the test script** to verify all operations work
2. **Deploy the enhanced Firebase Functions** with the new logging
3. **Set up weekly log analysis** to catch future issues early

## 🎯 This Fix Addresses

- **F-01**: The InternalServiceFault was actually a PHP fatal error, not a Tebra backend issue
- **F-03**: Enhanced logging now provides immediate visibility into such issues
- **F-04**: Clear error messages help distinguish between different failure types

---

**Priority**: 🔥 **CRITICAL** - This blocks all Tebra API functionality
