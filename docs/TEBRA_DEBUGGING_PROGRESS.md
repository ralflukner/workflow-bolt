# Tebra Appointment Sync - Debugging Progress Log

## Issue Summary

**Date:** June 11, 2025  
**Problem:** Tebra SOAP proxy returning 0 appointments in Cloud Run, while local PHP scripts returned 8 appointments  
**Status:** 🛠️ IN PROGRESS

## Latest Progress (June 15, 2025)

- **Official Example Verified**: Running the exact Tebra PHP example locally returned real patient data (171+ records) proving credentials and API work.
- **Client Refactor**: `TebraHttpClient.php` updated to mirror the official pattern for `GetPatients`, `GetProviders`, and `GetAppointments`.
- **Deployment**: Deployed to Cloud Run (revision `tebra-php-api-00019-xs8`). HTTP 200 responses observed.
- **Current Blocker**: Tebra backend now returns `"Unable to find user."`—likely an account activation/username formatting issue on Tebra side. No infrastructure or code errors observed.

Next steps:

1. Confirm with Tebra support that the integration user is fully activated.
2. Validate username formatting (case-sensitivity, domain, etc.).
3. Once user issue is resolved, re-run end-to-end tests.

## 2025-06-22 syncSchedule returns 0 appointments even though Tebra shows data

### Symptom

- UI shows "Today 0 / Tomorrow 0 appointments".
- Browser console & Cloud-Functions logs show the pipeline completes with `success:true`, but the payload from PHP → Tebra contains:

```json
{
  "success": true,
  "data": {
    "Appointments": null,
    "SecurityResponse": {
      "Authenticated": false,
      "Authorized": false,
      "CustomerKeyValid": true
    }
  }
}
```

### Root Cause

Tebra SOAP rejects the *GetAppointments* request – `Authenticated:false`. Other calls (for example *GetProviders*) succeed, so the network is fine; the appointment call is missing or using wrong credentials.

### Verified Flow

1. SPA → Node (`/api/tebra`) sends `{ action:"syncSchedule", params:{ date:"YYYY-MM-DD" } }`.
2. Node proxy forwards unchanged to PHP Cloud-Run.
3. PHP logs show the call and forward to Tebra SOAP.
4. SOAP reply says *not authenticated*, hence `Appointments:null`.

### Resolution Applied (June 23, 2025)

**Problem Identified**: The PHP `TebraApiClient::getAppointments()` method was missing the required authentication headers in the SOAP request.

**Fix Applied**: Updated `php/TebraApiClient.php` lines 87-99 to include proper `RequestHeader` with authentication credentials:

```php
$params = [
    'request' => [
        'RequestHeader' => [
            'User' => $this->username,
            'Password' => $this->password,
            'CustomerKey' => $this->customerKey
        ],
        'FromDate' => $fromDate,
        'ToDate' => $toDate
    ]
];
```

**Deployment**: Updated service deployed to Cloud Run revision `tebra-php-api-00047-7rl`.

### Testing Instructions

1. Quick browser test:

   ```javascript
   await fetch('https://us-central1-luknerlumina-firebase.cloudfunctions.net/tebraGetAppointments', {
       method: 'POST',
       headers: {
           'Content-Type': 'application/json',
           'Authorization': 'Bearer ' + await user.getIdToken()
       },
       body: JSON.stringify({
           startDate: '2024-01-01',
           endDate: '2024-12-31'
       })
   }).then(r => r.json()).then(console.log);
   ```

2. Expected result: `SecurityResponse.Authenticated: true` and populated `Appointments` array.

3. When authentication succeeds, run **Sync Schedule** in the UI – Firestore should now import correct appointment counts.

## 2025-06-23 Post-Authentication Fix - Still Getting 0 Appointments

### Current Status

**Issue**: Even after fixing authentication headers, sync still reports: "Sync completed. Imported 0 appointments for 2025-06-24."

**Problem**: We have **insufficient debugging instrumentation** to determine the root cause. The authentication fix was deployed but we don't have visibility into:

1. Whether the PHP service is actually receiving the corrected authentication
2. What Tebra's SOAP response contains (raw XML)
3. Whether date filtering is excluding all appointments
4. If appointments exist but are being filtered out during processing
5. Whether the Node.js → PHP → Tebra chain is working end-to-end

### Required Debugging Enhancements

**High Priority - Add These Debug Outputs:**

1. **PHP Service Logging** (`TebraApiClient.php`):
   ```php
   // Log the exact SOAP request being sent
   error_log("SOAP Request XML: " . $this->soapClient->__getLastRequest());
   
   // Log the full SOAP response from Tebra
   error_log("SOAP Response XML: " . $this->soapClient->__getLastResponse());
   
   // Log parsed appointment data before filtering
   error_log("Raw appointments from Tebra: " . json_encode($response));
   ```

2. **Node.js Proxy Logging** (Cloud Functions):
   ```javascript
   // Log the exact payload being sent to PHP service
   console.log("Sending to PHP service:", JSON.stringify(requestBody));
   
   // Log the full response from PHP service
   console.log("PHP service response:", JSON.stringify(phpResponse));
   ```

3. **Date Range Validation**:
   ```php
   // Verify the date range being requested
   error_log("Requesting appointments from: $fromDate to: $toDate");
   
   // Log any date format conversions
   error_log("Original dates - From: " . $params['fromDate'] . " To: " . $params['toDate']);
   
   // CRITICAL: Verify Tebra date format (YYYY-MM-DDThh:mm:ss:Z)
   error_log("Date format sent to Tebra - From: " . $formattedFromDate . " To: " . $formattedToDate);
   error_log("Date format validation - Expected: YYYY-MM-DDThh:mm:ss:Z");
   ```

4. **Appointment Processing Pipeline**:
   ```php
   // Count appointments at each stage
   error_log("Appointments received from Tebra: " . count($rawAppointments));
   error_log("Appointments after date filtering: " . count($filteredAppointments));
   error_log("Final appointments to return: " . count($finalAppointments));
   ```

### Immediate Action Items

1. **Deploy Enhanced Logging** - Add comprehensive debug logging to both PHP and Node.js services
2. **Test with Verbose Output** - Run sync operation and collect all debug logs
3. **Analyze SOAP Traffic** - Examine the exact XML being exchanged with Tebra
4. **Verify Date Handling** - Ensure date ranges and formats are correct
5. **Check Business Logic** - Verify appointment filtering/processing logic

### Hypothesis to Test

1. **Authentication may still be failing** despite the fix
2. **Date range filtering** may be too restrictive  
3. **Tebra may be returning appointments in unexpected format**
4. **Business logic filtering** may be excluding valid appointments
5. **Timezone handling** may be causing date mismatches

### **PRIMARY SUSPECT: Date/Timezone Mismatch**

**Critical Issue Identified**: The sync message shows "Imported 0 appointments for 2025-06-24" but today is 2025-06-22. This suggests:

1. **Timezone confusion** - Server may be in different timezone than expected
2. **Date calculation error** - "Tomorrow" logic may be adding wrong number of days  
3. **UTC vs Local time** - Date conversion may be shifting to wrong day
4. **Hardcoded date logic** - Code may be looking for wrong date entirely

**Immediate Debug Priority**:
```javascript
// Add to Node.js service
console.log("Current server time:", new Date().toISOString());
console.log("Requested date parameter:", requestedDate);
console.log("Calculated date range:", { startDate, endDate });
console.log("Server timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
```

```php
// Add to PHP service  
error_log("PHP server time: " . date('Y-m-d H:i:s T'));
error_log("Requested date range: " . json_encode(['from' => $fromDate, 'to' => $toDate]));
error_log("Server timezone: " . date_default_timezone_get());
```

**Root Cause Theory**: The system is looking for appointments on 2025-06-24 when it should be looking for 2025-06-22 (today) or 2025-06-23 (tomorrow). **However, appointments DO exist on 6/24**, so getting 0 results means something else is fundamentally broken in the pipeline.

**This is a complete mess** - we have multiple cascading issues:
1. **Date logic is wrong** (looking 2 days ahead)  
2. **Even when looking at the wrong date, it's still returning 0** (should find appointments)
3. **Authentication may still be failing** despite the "fix"
4. **Data processing pipeline is broken** somewhere between Tebra → PHP → Node → UI

**ADDITIONAL CRITICAL ISSUE: Incorrect Date Format**

**Tebra API Requirement**: Date format must be `YYYY-MM-DDThh:mm:ss:Z` (ISO 8601 with timezone)
**Current Implementation**: Unknown - likely sending incorrect format

**Critical Reality**: We have ZERO visibility into what's actually happening. Could be any combination of:
- **INCORRECT DATE FORMAT** - Tebra rejecting requests due to wrong date format
- SOAP requests failing silently
- Date format mismatches in multiple places
- Authentication still broken
- Data filtering removing all results
- Response parsing errors
- Multiple timezone conversions going wrong

## Repair Plan - Step by Step

### Phase 1: Comprehensive Instrumentation (CRITICAL - DO THIS FIRST)

**Priority**: Must be completed before any other repairs. We are debugging blind without this.

#### 1.1 Instrument PHP Service (`TebraApiClient.php`)

```php
public function getAppointments($fromDate, $toDate): array {
    // === INSTRUMENTATION START ===
    error_log("=== TEBRA APPOINTMENT REQUEST DEBUG ===");
    error_log("PHP server time: " . date('Y-m-d H:i:s T'));
    error_log("Server timezone: " . date_default_timezone_get());
    error_log("Input parameters - fromDate: $fromDate, toDate: $toDate");
    
    try {
        // Log the exact parameters being sent to SOAP
        $params = [
            'request' => [
                'RequestHeader' => [
                    'User' => $this->username,
                    'Password' => $this->password,
                    'CustomerKey' => $this->customerKey
                ],
                'FromDate' => $fromDate,
                'ToDate' => $toDate
            ]
        ];
        
        error_log("SOAP Parameters: " . json_encode($params, JSON_PRETTY_PRINT));
        
        $response = $this->soapClient->__call('GetAppointments', $params);
        
        // Log raw SOAP traffic
        error_log("SOAP Request XML: " . $this->soapClient->__getLastRequest());
        error_log("SOAP Response XML: " . $this->soapClient->__getLastResponse());
        
        // Log parsed response
        error_log("Parsed Response: " . json_encode($response, JSON_PRETTY_PRINT));
        
        // Count appointments at each stage
        $appointmentCount = 0;
        if (isset($response->Appointments)) {
            $appointmentCount = is_array($response->Appointments) ? count($response->Appointments) : 1;
        }
        error_log("Raw appointment count from Tebra: $appointmentCount");
        
        error_log("=== END TEBRA DEBUG ===");
        // === INSTRUMENTATION END ===
        
        return [
            'success' => true,
            'data' => $response,
            'timestamp' => date('c')
        ];
        
    } catch (Exception $e) {
        error_log("SOAP Exception: " . $e->getMessage());
        error_log("SOAP Request XML: " . $this->soapClient->__getLastRequest());
        error_log("SOAP Response XML: " . $this->soapClient->__getLastResponse());
        // ... existing error handling
    }
}
```

#### 1.2 Instrument Node.js Cloud Function

```javascript
// In tebraGetAppointments function
console.log("=== TEBRA NODE PROXY DEBUG ===");
console.log("Server time:", new Date().toISOString());
console.log("Server timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log("Request body:", JSON.stringify(req.body, null, 2));

// Before calling PHP service
console.log("Sending to PHP service:", JSON.stringify(requestBody, null, 2));

// After PHP response
console.log("PHP service response:", JSON.stringify(phpResponse, null, 2));
console.log("=== END NODE DEBUG ===");
```

#### 1.3 Instrument UI Sync Function

```javascript
// In syncSchedule function
console.log("=== UI SYNC DEBUG ===");
console.log("Client time:", new Date().toISOString());
console.log("Client timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log("Sync parameters:", { date, startDate, endDate });

// After API call
console.log("API response:", JSON.stringify(response, null, 2));
console.log("=== END UI DEBUG ===");
```

### Phase 2: Deploy Instrumented Code

1. **Deploy PHP service** with instrumentation to Cloud Run
2. **Deploy Node.js functions** with instrumentation
3. **Test sync operation** and collect all debug logs
4. **Analyze logs** from Cloud Run, Cloud Functions, and browser console

### Phase 3: Root Cause Analysis (Based on Instrumentation Results)

#### 3.1 Date Format Verification
- Verify dates being sent match `YYYY-MM-DDThh:mm:ss:Z` format
- Check for timezone conversion errors
- Validate date range logic (why 6/24 instead of 6/22)

#### 3.2 Authentication Verification  
- Confirm `SecurityResponse.Authenticated: true` in SOAP response
- Verify credentials are being sent correctly
- Check for encoding/special character issues

#### 3.3 Data Pipeline Verification
- Count appointments at each processing stage
- Verify data isn't being filtered out incorrectly
- Check for JSON parsing errors

### Phase 4: Systematic Repairs (DO NOT START UNTIL PHASE 1-3 COMPLETE)

#### 4.1 Fix Date Format Issues
```php
// Ensure proper ISO 8601 format with timezone
$fromDateTime = new DateTime($fromDate);
$toDateTime = new DateTime($toDate);
$formattedFrom = $fromDateTime->format('Y-m-d\TH:i:s\Z');
$formattedTo = $toDateTime->format('Y-m-d\TH:i:s\Z');
```

#### 4.2 Fix Date Calculation Logic
- Correct "today/tomorrow" date calculation
- Fix timezone handling
- Test with multiple date ranges

#### 4.3 Fix Authentication Issues (if any found)
- Verify SOAP header construction
- Test with known working credentials
- Validate against Tebra documentation

#### 4.4 Fix Data Processing Pipeline (if issues found)
- Repair appointment filtering logic
- Fix response parsing
- Validate data transformations

### Phase 5: Verification Testing

1. **Test with known date ranges** that have appointments
2. **Verify appointment counts** match Tebra dashboard
3. **Test edge cases** (empty days, large date ranges)
4. **Remove debug logging** from production code

### Critical Success Criteria

- [ ] **Phase 1**: Comprehensive debug logs showing exact data flow
- [ ] **Phase 2**: All services deployed and generating debug logs
- [ ] **Phase 3**: Root cause(s) identified from log analysis
- [ ] **Phase 4**: All identified issues systematically fixed
- [ ] **Phase 5**: Sync operation returning correct appointment counts

**⚠️ WARNING**: Do not attempt Phase 4 repairs until Phase 1-3 instrumentation reveals the actual root causes. Fixing the wrong things will waste time and potentially create new bugs.
