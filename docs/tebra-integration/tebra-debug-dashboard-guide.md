# Tebra Debug Dashboard Guide

## Overview

The Tebra Debug Dashboard (`src/components/TebraDebugDashboard.tsx`) is a comprehensive real-time monitoring interface that provides visual insight into the entire Tebra EHR SOAP API data flow. It's designed to efficiently monitor all 5 identified failure points and provide actionable debugging information.

## 🎯 Key Features

### 1. **Visual Data Flow Monitoring**

- **Real-time status indicators** for each step in the data flow chain
- **Color-coded health status** (Green=Healthy, Yellow=Warning, Red=Error)
- **Response time tracking** for performance monitoring
- **Correlation ID tracking** for request tracing

### 2. **Comprehensive Metrics Dashboard**

- **Success Rate**: Overall health percentage of the data flow
- **Average Response Time**: Performance metrics across all components
- **Active Error Count**: Number of currently failing components
- **Last Successful Sync**: When the complete flow last worked

### 3. **Error Tracking & Analysis**

- **Recent Errors Log**: Last 10 errors with timestamps and correlation IDs
- **Error Context**: Shows which component failed and detailed error messages
- **Correlation Tracing**: Links errors to specific request flows

### 4. **Auto-Refresh Monitoring**

- **10-second intervals**: Automatic health checks
- **Manual refresh**: On-demand status updates
- **Real-time indicators**: Shows when monitoring is active

## 🔧 Integration with Existing Monitoring

### Enhanced Debugging System Integration

The dashboard leverages the existing enhanced debugging infrastructure:

```typescript
// Connects to enhanced debug logger
const debugLogger = new DebugLogger('TebraDebugDashboard');

// Uses correlation IDs from the enhanced system
correlationId: generateCorrelationId() // Links to DEBUG-TOOLKIT.md system
```

### Cloud Logging Integration

In production, the dashboard connects to:

```typescript
// Firebase Functions health checks
firebase.functions().httpsCallable('tebraTestConnection')()

// Cloud Run service health
fetch(cloudRunUrl + '/health')

// Tebra API connectivity tests
// (Uses actual Tebra API endpoints)
```

### Log Analysis Integration

Works with the existing `analyze-logs.cjs` script:

```bash
# Dashboard can trigger log analysis
node analyze-logs.cjs --days=1 --service=tebra-php-api

# Results feed back into dashboard metrics
```

## 📊 Monitoring Each Failure Point

### **Critical Failure #1: PHP Fatal Error in Cloud Run**

```typescript
// Dashboard monitors Cloud Run health
case 'cloud-run':
  // Detects: "Fatal error: Call to undefined method TebraHttpClient::callSoapMethod()"
  // Shows: HTTP 500 responses and PHP fatal errors
  // Status: RED with error message
```

### **Critical Failure #2: Tebra Backend InternalServiceFault**

```typescript
// Dashboard monitors Tebra API responses
case 'tebra-api':
  // Detects: "InternalServiceFault: Tebra backend error"
  // Shows: API response errors and timeouts
  // Status: RED with fault details
```

### **System Failure #3: Authentication Issues**

```typescript
// Dashboard monitors auth flow
case 'firebase-functions':
  // Detects: "Unable to find user" and auth failures
  // Shows: Authentication success/failure rates
  // Status: RED with auth error context
```

### **Data Flow Failure #4: Empty Response Handling**

```typescript
// Dashboard monitors data transformation
case 'data-transform':
  // Detects: Empty or malformed responses
  // Shows: Data transformation success/failure
  // Status: YELLOW/RED based on data quality
```

### **Transformation Failure #5: Dashboard State Update**

```typescript
// Dashboard monitors final UI update
case 'dashboard-update':
  // Detects: Failed state updates
  // Shows: Whether patient data reached the UI
  // Status: GREEN only when patients are displayed
```

## 🚀 How to Use the Dashboard

### 1. **Add to Existing Dashboard**

```typescript
// In src/components/Dashboard.tsx
import TebraDebugDashboard from './TebraDebugDashboard';

// Add to debug panels section
{showDebugPanels && (
  <>
    <EnvDebugger />
    <FirebaseDebugger />
    <TebraDebugDashboard />  // Add this line
    <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <DiagnosticPanel />
      <WaitTimeDiagnostic />
      <PersistenceDiagnostic />
    </div>
  </>
)}
```

### 2. **Interpret Status Indicators**

| Status | Meaning | Action Required |
|--------|---------|----------------|
| 🟢 HEALTHY | Component working normally | No action needed |
| 🟡 WARNING | Component has issues but functional | Monitor closely |
| 🔴 ERROR | Component is failing | Immediate attention required |
| ⚪ UNKNOWN | Component status not determined | Check connectivity |

### 3. **Use Correlation IDs for Debugging**

When an error occurs:

1. **Note the Correlation ID** from the dashboard
2. **Search Cloud Logs** using the correlation ID:
   ```bash
   # In GCP Cloud Logging
   correlationId="abc123d4" AND timestamp>="2025-06-15T00:00:00Z"
   ```
3. **Trace the complete request flow** across all components

### 4. **Monitor Performance Trends**

- **Response times > 5000ms**: Indicates performance issues
- **Success rate < 95%**: Indicates reliability problems
- **Error spikes**: Correlate with specific times or operations

## 🔄 Real-Time Monitoring Workflow

### Typical Debugging Session

1. **Open Debug Dashboard** (via "Show Debug" button)
2. **Check Overall Success Rate**
   - If 0%: Critical infrastructure failure
   - If 50-80%: Intermittent issues
   - If >95%: Minor issues only

3. **Identify Failed Components**
   - Red indicators show problem areas
   - Click correlation IDs to trace issues

4. **Review Recent Errors**
   - Scroll through error log
   - Look for patterns (same error, same time)

5. **Take Action Based on Findings**
   - PHP errors → Deploy CloudRun fix
   - Tebra faults → Contact Tebra support
   - Auth errors → Check credentials

## 🎛️ Production Implementation

### Step 1: Connect Real Health Checks

Replace the simulated health checks with actual API calls:

```typescript
const checkStepHealth = async (stepId: string) => {
  switch (stepId) {
    case 'firebase-functions':
      try {
        const result = await firebase.functions().httpsCallable('tebraTestConnection')();
        return result.data.success ? 'healthy' : 'error';
      } catch (error) {
        return 'error';
      }
    
    case 'cloud-run':
      try {
        const response = await fetch(`${cloudRunUrl}/health`);
        return response.ok ? 'healthy' : 'error';
      } catch (error) {
        return 'error';
      }
    
    // Add other real checks...
  }
};
```

### Step 2: Integrate with Cloud Logging

```typescript
// Query actual logs for metrics
const fetchMetricsFromLogs = async () => {
  const logs = await queryCloudLogging({
    filter: 'resource.type="cloud_run_revision" AND resource.labels.service_name="tebra-php-api"',
    timeRange: 'last 1 hour'
  });
  
  return analyzeLogMetrics(logs);
};
```

### Step 3: Add Alerting

```typescript
// Alert when critical thresholds are exceeded
useEffect(() => {
  if (metrics.successRate < 50) {
    sendAlert('Critical: Tebra success rate below 50%');
  }
  if (metrics.errorCount > 3) {
    sendAlert('Warning: Multiple components failing');
  }
}, [metrics]);
```

## 🔍 Troubleshooting Common Scenarios

### Scenario 1: All Components Show RED

- **Likely Cause**: Complete system failure
- **Check**: Network connectivity, Firebase project status
- **Action**: Run `node test-debug-logging.cjs` to verify

### Scenario 2: Only Tebra API Shows RED

- **Likely Cause**: Tebra backend issues or auth problems
- **Check**: Recent error messages for "InternalServiceFault"
- **Action**: Contact Tebra support, check credentials

### Scenario 3: High Response Times

- **Likely Cause**: Performance bottlenecks
- **Check**: Cloud Run resource limits, database queries
- **Action**: Scale resources, optimize queries

### Scenario 4: Intermittent Failures

- **Likely Cause**: Rate limiting or timeouts
- **Check**: Error patterns by time of day
- **Action**: Implement retry logic, adjust timeouts

## 🎯 Success Metrics

The dashboard is working correctly when:

- ✅ **All 7 components show GREEN** during successful syncs
- ✅ **Correlation IDs are trackable** across all components
- ✅ **Response times are consistently < 5 seconds**
- ✅ **Success rate is > 95%** over 24-hour periods
- ✅ **Recent errors list is empty** during normal operation

## 🔗 Integration Points

### Works With

- **Enhanced Debug Logger** (`functions/src/debug-logger.js`)
- **Log Analysis Script** (`analyze-logs.cjs`)
- **Existing Debug Panels** (EnvDebugger, FirebaseDebugger)
- **Cloud Logging Infrastructure**

### Extends

- **Tebra API Failures Documentation** (`docs/tebra-api-failures.md`)
- **Debug Toolkit** (`DEBUG-TOOLKIT.md`)
- **Monitoring Strategy** (future Cloud Monitoring integration)

---

**Next Steps:**

1. Integrate dashboard into main UI
2. Connect to real monitoring APIs
3. Add automated alerting
4. Create mobile-responsive view for monitoring on-the-go
