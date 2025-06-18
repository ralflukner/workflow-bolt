# Tebra Data Flow Debugging Strategy Guide

## Overview

This guide documents the comprehensive debugging improvements implemented for the Tebra EHR SOAP API integration and provides strategic approaches for diagnosing and resolving data flow issues.

## 🛠️ Implemented Debugging Improvements

### 1. **TebraDebugDashboard Component** (`src/components/TebraDebugDashboard.tsx`)

**What It Does:**
- Real-time monitoring of all 7 data flow steps
- Visual health indicators with color-coded status
- Performance metrics and correlation ID tracking
- Auto-refresh every 10 seconds with manual refresh option

**Key Features:**
- **Success Rate Tracking**: Overall system health percentage
- **Response Time Monitoring**: Performance metrics across components
- **Error Correlation**: Links errors using correlation IDs
- **Recent Errors Log**: Last 10 errors with timestamps

### 2. **Enhanced PHP Proxy Logging** (`tebra-php-api/src/TebraHttpClient.php`)

**What It Does:**
- Comprehensive request/response logging with security redaction
- Health status tracking with success/failure metrics
- Performance monitoring with duration tracking

**Key Features:**
- **Redacted Logging**: Sensitive data (passwords, SSN, DOB) shown as `[REDACTED]`
- **Health Metrics**: Success rates, last success/failure timestamps
- **Performance Tracking**: Request duration monitoring
- **Audit Trail**: Complete log of all API interactions

### 3. **Patient Management Improvements**

**What It Does:**
- Delete functionality for patient cards with confirmation
- Enhanced patient context with delete operations
- UI improvements for better data management

### 4. **Health Status Endpoints**

**What It Does:**
- `/health/status` - Comprehensive health metrics endpoint
- `testConnection` - Tebra connectivity testing
- `getHealthStatus` - Detailed health metrics retrieval

## 🎯 Strategic Debugging Approach

### **Phase 1: Real-Time Monitoring**

Use the TebraDebugDashboard for continuous system monitoring:

**Hypothetical Example:**
```
Dashboard shows:
- Success Rate: 23.4%
- Firebase Functions: 🟢 HEALTHY  
- Cloud Run PHP: 🔴 ERROR (response: 152ms)
- Tebra API: 🔴 ERROR (response: 3,247ms)
- Recent Error: "Fatal error: Call to undefined method" (ID: 3yo0fgwv)
```

**Strategic Action:**
1. **Identify the bottleneck**: Cloud Run PHP service failing
2. **Use correlation ID**: Search logs for `3yo0fgwv`
3. **Root cause**: Missing method implementation
4. **Solution pathway**: Deploy PHP fix → Monitor success rate improvement

### **Phase 2: Error Correlation and Deep Dive**

Use correlation IDs to trace complete request flows:

**Actual Example from Enhanced Logging:**
```
[TEBRA_API] GetAppointments FAILED: 
{
  "fromDate":"6/17/2025",
  "toDate":"6/17/2025",
  "action":"Attempted to get appointments for June 17, 2025",
  "correlationId":"h5cgqyia"
} 
Error: Object reference not set to an instance of an object
Duration: 245ms
```

**Strategic Action:**
1. **Search Cloud Logs**: `correlationId="h5cgqyia"`
2. **Trace flow**: Find all log entries with this ID
3. **Identify pattern**: Error occurs with specific date ranges
4. **Root cause**: Tebra backend issue with future dates

### **Phase 3: Performance Analysis**

Use health metrics to identify performance bottlenecks:

**Hypothetical Health Status Response:**
```json
{
  "status": "operational",
  "timestamp": "2025-06-15T14:30:00Z",
  "health_metrics": {
    "total_requests": 1247,
    "success_count": 891,
    "failure_count": 356,
    "success_rate": 71.4,
    "last_success": "2025-06-15T14:29:45Z",
    "last_failure": "2025-06-15T14:29:58Z",
    "methods": {
      "GetAppointments": {
        "success_count": 234,
        "failure_count": 89,
        "success_rate": 72.4,
        "avg_duration_ms": 1456
      },
      "GetPatients": {
        "success_count": 456,
        "failure_count": 123,
        "success_rate": 78.8,
        "avg_duration_ms": 892
      }
    }
  }
}
```

**Strategic Action:**
1. **Analyze success rates**: GetPatients performing better than GetAppointments
2. **Performance comparison**: GetAppointments taking 1.6x longer
3. **Focus efforts**: Optimize GetAppointments method first
4. **Set targets**: Aim for >95% success rate, <1000ms response time

## 📊 Debugging Workflow Examples

### **Scenario 1: Complete System Failure (0% Success Rate)**

**Dashboard Indicators:**
- All components showing 🔴 RED status
- Success rate: 0%
- Recent errors: Multiple "Connection refused" errors

**Debugging Steps:**
1. **Check Infrastructure**: 
   ```bash
   curl https://tebra-php-api-url/health/status
   ```
2. **Verify Cloud Run**: Check deployment status and logs
3. **Test Firebase Functions**: Use admin SDK to test callable functions
4. **Network Issues**: Check DNS, firewall, connectivity

**Expected Resolution Time**: 5-15 minutes

### **Scenario 2: Intermittent Failures (50-80% Success Rate)**

**Dashboard Indicators:**
- Components alternating between 🟢 GREEN and 🔴 RED
- Success rate: 67.3%
- Recent errors: Mix of timeouts and InternalServiceFaults

**Debugging Steps:**
1. **Pattern Analysis**: 
   ```bash
   grep "FAILED" logs | grep -E "(timeout|InternalServiceFault)" | head -20
   ```
2. **Time-based correlation**: Check if failures correlate with specific times
3. **Rate limiting**: Look for HTTP 429 responses
4. **Tebra backend status**: Contact Tebra support if InternalServiceFaults persist

**Expected Resolution Time**: 30-60 minutes

### **Scenario 3: Performance Degradation (High Response Times)**

**Dashboard Indicators:**
- Components showing 🟢 GREEN but high response times (>5000ms)
- Success rate: 94.2%
- Performance trending downward

**Debugging Steps:**
1. **Performance profiling**:
   ```bash
   grep "Duration:" logs | awk '{print $NF}' | sort -n | tail -20
   ```
2. **Resource monitoring**: Check Cloud Run CPU/Memory usage
3. **Database performance**: Monitor Firestore query performance
4. **Network latency**: Test connectivity to Tebra endpoints

**Expected Resolution Time**: 15-45 minutes

## 🔍 Advanced Debugging Techniques

### **Correlation ID Tracing**

**Purpose**: Follow a single request through the entire system

**Example Workflow:**
1. **Capture correlation ID** from debug dashboard: `seax6ur9`
2. **Search Firebase Functions logs**:
   ```bash
   gcloud logging read 'jsonPayload.correlationId="seax6ur9"' --limit=50
   ```
3. **Search Cloud Run logs**:
   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" AND textPayload:"seax6ur9"' --limit=50
   ```
4. **Trace complete flow**: Map request journey across all components

### **Health Trend Analysis**

**Purpose**: Identify degradation patterns over time

**Example Analysis:**
```bash
# Get health metrics every hour for 24 hours
for hour in {0..23}; do
  curl -s "https://tebra-php-api-url/health/status" | \
  jq '.health_metrics.success_rate' >> success_rates.log
  sleep 3600
done

# Analyze trends
awk '{sum+=$1; if(min==""){min=max=$1}; if($1>max){max=$1}; if($1<min){min=$1}} END {print "Avg:",sum/NR,"Min:",min,"Max:",max}' success_rates.log
```

### **Error Pattern Recognition**

**Purpose**: Identify recurring issues and their root causes

**Common Error Patterns:**

1. **PHP Fatal Errors**:
   ```
   Pattern: "Fatal error: Call to undefined method"
   Root Cause: Missing method implementation
   Fix: Deploy code with missing methods
   ```

2. **Tebra InternalServiceFaults**:
   ```
   Pattern: "InternalServiceFault: Tebra backend error"
   Root Cause: External Tebra backend instability
   Fix: Implement retry logic, contact Tebra support
   ```

3. **Authentication Failures**:
   ```
   Pattern: "Unable to find user" / "Authentication failed"
   Root Cause: Credential issues or account activation
   Fix: Verify credentials, contact Tebra for account status
   ```

## 📈 Success Metrics and KPIs

### **Primary Health Indicators**

| **Metric** | **Target** | **Warning** | **Critical** |
|------------|------------|-------------|--------------|
| Success Rate | >95% | 85-95% | <85% |
| Response Time | <2000ms | 2000-5000ms | >5000ms |
| Error Rate | <5% | 5-15% | >15% |
| Uptime | >99.5% | 98-99.5% | <98% |

### **Component-Level Monitoring**

**Firebase Functions**:
- Cold start frequency: <10% of requests
- Execution time: <30 seconds
- Memory usage: <512MB

**Cloud Run PHP Service**:
- Request processing: <3 seconds
- Memory usage: <1GB
- CPU utilization: <80%

**Tebra SOAP API**:
- Response time: <2 seconds
- InternalServiceFault rate: <1%
- Authentication success: >99.9%

## 🚀 Proactive Monitoring Strategy

### **Automated Alerting Thresholds**

```javascript
// Example alerting logic
if (metrics.successRate < 85) {
  sendAlert('CRITICAL: Success rate below 85%', 'critical');
}
if (metrics.averageResponseTime > 5000) {
  sendAlert('WARNING: High response times detected', 'warning');
}
if (metrics.errorCount > 10) {
  sendAlert('INFO: Error count spike detected', 'info');
}
```

### **Daily Health Reports**

**Automated daily summary**:
- Success rate trends
- Performance metrics
- Top error categories
- Component health status
- Recommendations for optimization

### **Predictive Monitoring**

**Trend analysis for early warning**:
- Response time degradation patterns
- Error rate increases
- Success rate declines
- Resource utilization trends

## 🎯 Strategic Implementation Plan

### **Phase 1: Immediate (Week 1)**
- ✅ Deploy TebraDebugDashboard
- ✅ Implement enhanced PHP logging
- ✅ Add health status endpoints
- ✅ Set up correlation ID tracking

### **Phase 2: Enhancement (Week 2-3)**
- 🔄 Connect real API health checks
- 🔄 Implement automated alerting
- 🔄 Add performance trending
- 🔄 Create daily health reports

### **Phase 3: Optimization (Week 4+)**
- 🔄 Predictive failure detection
- 🔄 Auto-scaling based on metrics
- 🔄 Machine learning anomaly detection
- 🔄 Self-healing capabilities

## 📚 Quick Reference Commands

### **Check Overall System Health**
```bash
curl -s "https://tebra-php-api-url/health/status" | jq '.'
```

### **Monitor Real-Time Success Rate**
```bash
watch -n 5 'curl -s "https://tebra-php-api-url/health/status" | jq ".health_metrics.success_rate"'
```

### **Find Correlation ID in Logs**
```bash
gcloud logging read 'jsonPayload.correlationId="your-correlation-id"' --limit=100
```

### **Analyze Error Patterns**
```bash
grep "FAILED" logs/*.log | cut -d':' -f3 | sort | uniq -c | sort -nr
```

### **Performance Trend Analysis**
```bash
grep "Duration:" logs/*.log | awk '{print $NF}' | sed 's/ms//' | \
awk '{sum+=$1; sumsq+=$1*$1} END {print "Avg:", sum/NR, "StdDev:", sqrt(sumsq/NR - (sum/NR)^2)}'
```

---

**This debugging strategy provides a comprehensive approach to monitoring, diagnosing, and resolving Tebra data flow issues with both reactive and proactive capabilities.** 