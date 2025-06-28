# Phase 2: Comprehensive Instrumentation Design Document

**Version**: 1.0  
**Date**: 2025-06-22  
**Purpose**: Deploy comprehensive debugging instrumentation across the entire Tebra appointment sync pipeline

## Overview

Phase 2 implements comprehensive logging and debugging instrumentation across all components of the Tebra appointment sync pipeline to provide complete visibility into data flow, transformations, and failure points.

## Architecture Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │────│  Node.js Cloud   │────│  PHP Cloud Run  │────│  Tebra SOAP     │
│   (Browser)     │    │   Functions      │    │    Service      │    │     API         │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │                        │
        ▼                        ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Browser Console │    │ Cloud Functions  │    │ Cloud Run Logs  │    │ SOAP Request/   │
│     Logs        │    │      Logs        │    │                 │    │   Response      │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └─────────────────┘
```

## Instrumentation Strategy

### Level 1: Entry Point Logging

- **What**: Log all input parameters, timestamps, and environment info
- **Where**: Beginning of each major function
- **Why**: Establish baseline of what each service receives

### Level 2: Transformation Logging  

- **What**: Log data transformations, format conversions, calculations
- **Where**: Before/after each data transformation step
- **Why**: Identify where data gets corrupted or incorrectly formatted

### Level 3: External API Logging

- **What**: Log exact requests/responses to external services
- **Where**: Before/after SOAP calls, HTTP requests
- **Why**: See exactly what's being sent to Tebra and what comes back

### Level 4: Error Context Logging

- **What**: Enhanced error information with full context
- **Where**: All try/catch blocks
- **Why**: Understand failure scenarios with complete state information

## Component Implementation Details

### 2.1 React UI Instrumentation

**File**: `src/services/tebraApi.js` and sync-related UI components

#### Implementation

```javascript
// Enhanced logging wrapper
function debugLog(component, operation, data) {
    const timestamp = new Date().toISOString();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    console.group(`🔍 [${component}] ${operation} @ ${timestamp}`);
    console.log('Timezone:', timezone);
    console.log('Data:', JSON.stringify(data, null, 2));
    console.groupEnd();
}

// In tebraGetAppointments function
export async function tebraGetAppointments(params) {
    debugLog('UI-TebraApi', 'tebraGetAppointments-START', {
        inputParams: params,
        userToken: 'present',
        environment: process.env.NODE_ENV
    });
    
    try {
        // ... existing API call logic
        
        debugLog('UI-TebraApi', 'tebraGetAppointments-RESPONSE', {
            success: result.success,
            dataKeys: Object.keys(result.data || {}),
            appointmentCount: result.data?.Appointments?.length || 0,
            securityResponse: result.data?.SecurityResponse
        });
        
        return result;
    } catch (error) {
        debugLog('UI-TebraApi', 'tebraGetAppointments-ERROR', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

// In sync schedule UI component
function syncSchedule(targetDate) {
    debugLog('UI-Sync', 'syncSchedule-START', {
        targetDate,
        calculatedDateRange: {
            start: calculateStartDate(targetDate),
            end: calculateEndDate(targetDate)
        }
    });
    
    // ... existing sync logic with instrumentation at each step
}
```

#### Deployment Strategy

- **Method**: Update existing source files
- **Testing**: Verify console logs appear in browser dev tools
- **Rollback**: Git revert if issues occur

### 2.2 Node.js Cloud Functions Instrumentation

**File**: `functions/index.js` - `tebraGetAppointments` function

#### Implementation

```javascript
exports.tebraGetAppointments = functions.https.onCall(async (data, context) => {
    const requestId = generateRequestId();
    
    // Level 1: Entry Point Logging
    console.log(`🔍 [NODE-${requestId}] tebraGetAppointments START`, {
        timestamp: new Date().toISOString(),
        timezone: process.env.TZ || 'UTC',
        inputData: JSON.stringify(data, null, 2),
        authUID: context.auth?.uid,
        environment: process.env.NODE_ENV
    });
    
    try {
        // Level 2: Transformation Logging
        const requestBody = {
            action: 'getAppointments',
            params: {
                fromDate: data.startDate,
                toDate: data.endDate
            }
        };
        
        console.log(`🔍 [NODE-${requestId}] Calling PHP service`, {
            phpServiceUrl: process.env.TEBRA_PHP_API_URL,
            requestBody: JSON.stringify(requestBody, null, 2),
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'present'
            }
        });
        
        // Level 3: External API Logging
        const phpResponse = await fetch(process.env.TEBRA_PHP_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.INTERNAL_API_KEY
            },
            body: JSON.stringify(requestBody)
        });
        
        const phpData = await phpResponse.json();
        
        console.log(`🔍 [NODE-${requestId}] PHP service response`, {
            httpStatus: phpResponse.status,
            responseSize: JSON.stringify(phpData).length,
            success: phpData.success,
            dataStructure: analyzeDataStructure(phpData),
            securityResponse: phpData.data?.SecurityResponse,
            appointmentCount: phpData.data?.Appointments?.length || 0
        });
        
        // Level 2: Data Processing Logging
        const processedData = processAppointmentData(phpData);
        
        console.log(`🔍 [NODE-${requestId}] Data processing complete`, {
            originalCount: phpData.data?.Appointments?.length || 0,
            processedCount: processedData.appointments?.length || 0,
            filteringApplied: processedData.filtersApplied || []
        });
        
        console.log(`🔍 [NODE-${requestId}] tebraGetAppointments SUCCESS`);
        return processedData;
        
    } catch (error) {
        // Level 4: Error Context Logging
        console.error(`🔍 [NODE-${requestId}] tebraGetAppointments ERROR`, {
            error: error.message,
            stack: error.stack,
            inputData: JSON.stringify(data, null, 2),
            timestamp: new Date().toISOString()
        });
        
        throw new functions.https.HttpsError(
            'internal',
            'Failed to fetch appointments',
            { requestId, originalError: error.message }
        );
    }
});

// Helper functions
function generateRequestId() {
    return Math.random().toString(36).substring(2, 15);
}

function analyzeDataStructure(data) {
    if (!data || typeof data !== 'object') return 'invalid';
    
    return {
        topLevelKeys: Object.keys(data),
        hasSuccess: 'success' in data,
        hasData: 'data' in data,
        dataType: data.data ? typeof data.data : 'none',
        dataKeys: data.data && typeof data.data === 'object' ? Object.keys(data.data) : []
    };
}
```

#### Deployment Strategy

- **Method**: `firebase deploy --only functions:tebraGetAppointments`
- **Testing**: Monitor Cloud Functions logs during test calls
- **Rollback**: Previous function version via Firebase Console

### 2.3 PHP Cloud Run Service Instrumentation

**File**: `tebra-php-api/src/TebraApiClient.php`

#### Implementation

```php
<?php

class TebraApiClient {
    private $debugEnabled = true; // TODO: Make configurable via env var
    
    public function getAppointments($fromDate, $toDate): array {
        $requestId = $this->generateRequestId();
        
        // Level 1: Entry Point Logging
        $this->debugLog($requestId, 'PHP-getAppointments START', [
            'timestamp' => date('c'),
            'server_time' => date('Y-m-d H:i:s T'),
            'timezone' => date_default_timezone_get(),
            'input_fromDate' => $fromDate,
            'input_toDate' => $toDate,
            'php_version' => PHP_VERSION,
            'memory_usage' => memory_get_usage(true)
        ]);
        
        try {
            // Level 2: Transformation Logging
            $formattedDates = $this->formatDatesForTebra($fromDate, $toDate);
            
            $this->debugLog($requestId, 'Date formatting', [
                'original_from' => $fromDate,
                'original_to' => $toDate,
                'formatted_from' => $formattedDates['from'],
                'formatted_to' => $formattedDates['to'],
                'format_used' => 'Y-m-d\TH:i:s\Z'
            ]);
            
            // Level 2: SOAP Parameters Logging
            $soapParams = [
                'request' => [
                    'RequestHeader' => [
                        'User' => $this->username,
                        'Password' => '***REDACTED***', // Never log actual password
                        'CustomerKey' => $this->customerKey
                    ],
                    'FromDate' => $formattedDates['from'],
                    'ToDate' => $formattedDates['to']
                ]
            ];
            
            $this->debugLog($requestId, 'SOAP parameters prepared', [
                'parameter_structure' => $this->analyzeParameterStructure($soapParams),
                'auth_present' => !empty($this->username) && !empty($this->password),
                'customer_key_present' => !empty($this->customerKey)
            ]);
            
            // Level 3: External API Logging (Before)
            $this->debugLog($requestId, 'Calling Tebra SOAP GetAppointments', [
                'wsdl_url' => $this->wsdlUrl,
                'method' => 'GetAppointments',
                'soap_version' => 'SOAP_1_2'
            ]);
            
            // Actual SOAP parameters (with password for real call)
            $actualSoapParams = [
                'request' => [
                    'RequestHeader' => [
                        'User' => $this->username,
                        'Password' => $this->password,
                        'CustomerKey' => $this->customerKey
                    ],
                    'FromDate' => $formattedDates['from'],
                    'ToDate' => $formattedDates['to']
                ]
            ];
            
            $response = $this->soapClient->__call('GetAppointments', $actualSoapParams);
            
            // Level 3: External API Logging (After)
            $soapRequestXml = $this->soapClient->__getLastRequest();
            $soapResponseXml = $this->soapClient->__getLastResponse();
            
            $this->debugLog($requestId, 'SOAP request/response captured', [
                'request_size' => strlen($soapRequestXml),
                'response_size' => strlen($soapResponseXml),
                'request_contains_auth' => strpos($soapRequestXml, '<User>') !== false,
                'response_contains_appointments' => strpos($soapResponseXml, 'Appointment') !== false
            ]);
            
            // Log actual SOAP XML (truncated for security)
            error_log("SOAP Request XML: " . $this->truncateXml($soapRequestXml, 1000));
            error_log("SOAP Response XML: " . $this->truncateXml($soapResponseXml, 2000));
            
            // Level 2: Response Processing Logging
            $processedResponse = $this->processAppointmentResponse($response);
            
            $this->debugLog($requestId, 'Response processing complete', [
                'raw_response_type' => gettype($response),
                'security_response' => $processedResponse['SecurityResponse'] ?? 'missing',
                'appointments_type' => gettype($processedResponse['Appointments'] ?? null),
                'appointment_count' => $this->countAppointments($processedResponse['Appointments']),
                'authentication_status' => $processedResponse['SecurityResponse']['Authenticated'] ?? 'unknown'
            ]);
            
            $this->debugLog($requestId, 'PHP-getAppointments SUCCESS');
            
            return [
                'success' => true,
                'data' => $processedResponse,
                'timestamp' => date('c'),
                'debug_request_id' => $requestId
            ];
            
        } catch (SoapFault $e) {
            // Level 4: SOAP Error Logging
            $this->debugLog($requestId, 'SOAP FAULT', [
                'fault_code' => $e->faultcode,
                'fault_string' => $e->faultstring,
                'last_request' => $this->truncateXml($this->soapClient->__getLastRequest(), 1000),
                'last_response' => $this->truncateXml($this->soapClient->__getLastResponse(), 1000)
            ]);
            
            throw $e;
            
        } catch (Exception $e) {
            // Level 4: General Error Logging
            $this->debugLog($requestId, 'GENERAL ERROR', [
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'stack_trace' => $e->getTraceAsString(),
                'memory_usage' => memory_get_usage(true)
            ]);
            
            throw $e;
        }
    }
    
    // Helper methods for instrumentation
    private function generateRequestId(): string {
        return 'php-' . uniqid() . '-' . substr(md5(microtime(true)), 0, 8);
    }
    
    private function debugLog(string $requestId, string $operation, array $data = []): void {
        if (!$this->debugEnabled) return;
        
        $logEntry = [
            'request_id' => $requestId,
            'operation' => $operation,
            'timestamp' => microtime(true),
            'data' => $data
        ];
        
        error_log("🔍 [PHP-DEBUG] " . json_encode($logEntry, JSON_PRETTY_PRINT));
    }
    
    private function formatDatesForTebra(string $fromDate, string $toDate): array {
        // Ensure proper ISO 8601 format: YYYY-MM-DDThh:mm:ss:Z
        $from = new DateTime($fromDate);
        $to = new DateTime($toDate);
        
        return [
            'from' => $from->format('Y-m-d\TH:i:s\Z'),
            'to' => $to->format('Y-m-d\TH:i:s\Z')
        ];
    }
    
    private function analyzeParameterStructure(array $params): array {
        return [
            'has_request' => isset($params['request']),
            'has_request_header' => isset($params['request']['RequestHeader']),
            'auth_fields_present' => [
                'User' => isset($params['request']['RequestHeader']['User']),
                'Password' => isset($params['request']['RequestHeader']['Password']),
                'CustomerKey' => isset($params['request']['RequestHeader']['CustomerKey'])
            ],
            'date_fields_present' => [
                'FromDate' => isset($params['request']['FromDate']),
                'ToDate' => isset($params['request']['ToDate'])
            ]
        ];
    }
    
    private function processAppointmentResponse($response): array {
        // Convert SOAP response to array format
        // This method should handle the actual response processing
        // Implementation depends on actual Tebra response structure
        return (array) $response;
    }
    
    private function countAppointments($appointments): int {
        if (is_null($appointments)) return 0;
        if (is_array($appointments)) return count($appointments);
        if (is_object($appointments)) return 1;
        return 0;
    }
    
    private function truncateXml(string $xml, int $maxLength): string {
        if (strlen($xml) <= $maxLength) return $xml;
        return substr($xml, 0, $maxLength) . "\n... [TRUNCATED - Original length: " . strlen($xml) . " chars]";
    }
}
```

#### Deployment Strategy

- **Method**: Cloud Run deployment via `./tebra-php-api/deploy.sh`
- **Testing**: Monitor Cloud Run logs during test calls
- **Rollback**: Previous Cloud Run revision via Google Cloud Console

### 2.4 Log Aggregation and Monitoring

#### Cloud Logging Query Templates

```sql
-- All Tebra-related logs across services
resource.type="cloud_function" OR resource.type="cloud_run_revision"
labels."service-name"="tebra-php-api" OR labels."function-name"="tebraGetAppointments"
jsonPayload.message=~"🔍.*" OR textPayload=~"🔍.*"

-- PHP Service Specific Logs
resource.type="cloud_run_revision"
resource.labels.service_name="tebra-php-api"
textPayload=~"🔍 \[PHP-DEBUG\].*"

-- Node.js Function Specific Logs  
resource.type="cloud_function"
resource.labels.function_name="tebraGetAppointments"
textPayload=~"🔍 \[NODE-.*"

-- Error-only Logs
resource.type=("cloud_function" OR "cloud_run_revision")
severity>=ERROR
(labels."service-name"="tebra-php-api" OR labels."function-name"="tebraGetAppointments")
```

## Deployment Plan

### Pre-Deployment Checklist

- [ ] All instrumentation code reviewed and tested locally
- [ ] Environment variables configured for debug levels
- [ ] Log retention policies configured
- [ ] Monitoring dashboards prepared
- [ ] Rollback procedures documented

### Deployment Sequence

1. **Deploy PHP Service** (First - Most Critical)
   ```bash
   cd tebra-php-api
   ./deploy.sh
   ```

2. **Deploy Node.js Functions** (Second)
   ```bash
   firebase deploy --only functions:tebraGetAppointments
   ```

3. **Update UI Code** (Third - Least Risk)
   ```bash
   # Deploy to staging environment first
   npm run build
   firebase deploy --only hosting:staging
   ```

4. **Verify Deployment** (Final)
   - Test sync operation from UI
   - Verify logs appear in all three locations
   - Check log formatting and completeness

### Success Criteria

- [ ] Browser console shows UI debug logs
- [ ] Cloud Functions logs show Node.js debug logs  
- [ ] Cloud Run logs show PHP debug logs
- [ ] All logs include request correlation IDs
- [ ] SOAP request/response XML captured in logs
- [ ] Date format validation logs present
- [ ] Authentication status clearly logged
- [ ] Appointment count tracking works

### Monitoring During Deployment

#### Real-time Log Monitoring Commands

```bash
# Monitor PHP service logs
gcloud logging tail "resource.type=cloud_run_revision resource.labels.service_name=tebra-php-api" --format=json

# Monitor Node.js function logs
gcloud logging tail "resource.type=cloud_function resource.labels.function_name=tebraGetAppointments" --format=json

# Monitor for errors across all services
gcloud logging tail "severity>=ERROR (labels.service-name=tebra-php-api OR labels.function-name=tebraGetAppointments)" --format=json
```

#### Performance Impact Assessment

- **Expected log volume**: ~50-100 log entries per sync operation
- **Storage impact**: ~10-20KB per sync operation
- **Performance overhead**: <100ms additional latency
- **Cost impact**: Minimal (within free tier for development)

## Risk Mitigation

### Potential Issues and Solutions

1. **Log Volume Overflow**
   - **Risk**: Too many logs could impact performance/cost
   - **Mitigation**: Configurable debug levels, log sampling

2. **Sensitive Data Exposure**
   - **Risk**: Passwords/keys accidentally logged
   - **Mitigation**: Explicit redaction in all log statements

3. **Performance Degradation**
   - **Risk**: Excessive logging slows down sync
   - **Mitigation**: Async logging, conditional debug levels

4. **Storage Costs**
   - **Risk**: Debug logs consume significant storage
   - **Mitigation**: Short retention periods, log level controls

### Rollback Procedures

1. **Immediate Rollback** (if critical issues)
   - Revert to previous Cloud Run revision
   - Revert to previous Cloud Function deployment
   - Disable debug logging via environment variables

2. **Partial Rollback** (if specific component issues)
   - Rollback individual services while keeping others instrumented
   - Adjust log levels instead of complete removal

## Post-Deployment Actions

1. **Execute Test Sync Operation**
2. **Collect Complete Log Set**
3. **Analyze Data Flow**
4. **Document Findings**
5. **Prepare Phase 3 Root Cause Analysis**

## Success Metrics

- **Visibility**: 100% of data pipeline steps logged
- **Traceability**: Request correlation across all services
- **Completeness**: SOAP XML, dates, authentication, and data counts captured
- **Usability**: Logs are searchable and well-formatted
- **Performance**: <5% performance impact on sync operations

This instrumentation will provide the complete visibility needed to identify the root causes of the appointment sync issues and enable targeted fixes in subsequent phases.
