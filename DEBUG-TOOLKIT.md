# Tebra API Debugging Toolkit

This toolkit provides enhanced debugging capabilities for the Tebra API integration, helping you identify and resolve issues more effectively.

## 🔧 What's Included

### 1. Enhanced Debug Logger (`functions/src/debug-logger.js`)

- **Correlation IDs**: Track requests across multiple components
- **Timing Information**: Measure operation durations
- **Structured Logging**: Consistent log format with metadata
- **Security**: Automatically redacts sensitive headers
- **Context**: Child loggers inherit correlation IDs

### 2. Enhanced Tebra Proxy Client

- **Detailed API Logging**: Every request/response logged with timing
- **Error Context**: Enhanced error objects with correlation IDs
- **Special Tebra Fault Detection**: Identifies `InternalServiceFault` errors
- **Performance Tracking**: Request duration monitoring

### 3. Test Script (`test-debug-logging.cjs`)

- **Comprehensive Testing**: Tests all major Tebra operations
- **Error Simulation**: Deliberately triggers errors to test logging
- **Real-world Scenarios**: Large date ranges that might cause faults

### 4. Log Analysis Script (`analyze-logs.cjs`)

- **Pattern Recognition**: Identifies common error patterns
- **Performance Analysis**: Response time metrics and trends
- **Tebra Fault Analysis**: Specific analysis of InternalServiceFault errors
- **Automated Recommendations**: Suggests fixes based on log patterns

## 🚀 Quick Start

### Step 1: Test the Enhanced Logging

```bash
# Run the test script to see enhanced logging in action
node test-debug-logging.cjs
```

This will show you:

- Correlation IDs linking related operations
- Timing information for each step
- Detailed error context when failures occur
- Special handling for Tebra InternalServiceFault errors

### Step 2: Analyze Your Logs

```bash
# Analyze the last 7 days of logs
node analyze-logs.cjs

# Analyze the last 30 days
node analyze-logs.cjs --days=30

# Analyze a specific service
node analyze-logs.cjs --service=tebra-php-api --days=14
```

This will provide:

- Error rate analysis
- Performance metrics (avg, median, 95th percentile)
- Tebra fault patterns by action and time
- Automated recommendations for fixes

## 📊 Understanding the Output

### Sample Enhanced Log Entry

```
[INFO] TebraProxyClient:makeRequest:a1b2c3d4:3 (+1250ms) Starting request {
  action: 'getAppointments',
  paramsKeys: ['fromDate', 'toDate'],
  paramsSize: 45
}
```

**Breakdown:**

- `[INFO]`: Log level
- `TebraProxyClient:makeRequest`: Component and sub-component
- `a1b2c3d4`: Correlation ID (tracks this request across all logs)
- `3`: Step number in this operation
- `+1250ms`: Time elapsed since operation started
- `Starting request`: Human-readable message
- `{ ... }`: Structured metadata

### Sample Analysis Output

```
📊 ANALYSIS RESULTS
==================

📈 SUMMARY:
   Total logs: 1,247
   Errors: 89 (7.14%)
   Warnings: 23
   Info: 1,135

🚨 ERROR PATTERNS:
   TEBRA_FAULT: 45 occurrences
     - 2025-06-15T10:30:15Z: InternalServiceFault: Tebra backend error...
   TIMEOUT: 12 occurrences
   RATE_LIMIT: 8 occurrences

💡 RECOMMENDATIONS:
   1. [HIGH] TEBRA_FAULTS: 45 Tebra InternalServiceFaults detected - implement retry logic with exponential backoff
   2. [MEDIUM] RATE_LIMITING: 8 rate limit errors - implement client-side throttling
```

## 🔍 Debugging Specific Issues

### Issue: InternalServiceFault from Tebra

**What to look for in logs:**

```bash
# Search for correlation IDs of failed requests
grep "InternalServiceFault" your-logs.txt | grep -o "correlationId:[a-f0-9]*"
```

**Enhanced logging will show:**

- Exact request parameters that triggered the fault
- Timing information (was it a timeout?)
- Correlation ID to trace the full request flow
- Whether it's happening with specific actions or date ranges

### Issue: Slow Performance

**What the analysis will show:**

- 95th percentile response times
- Which operations are slowest
- Performance trends over time
- Recommendations for caching or optimization

### Issue: Rate Limiting

**Enhanced logging captures:**

- Exact rate limit error responses
- Request frequency patterns
- Which operations hit limits most often
- Timing between requests

## 🛠️ Customizing the Debugging

### Add Custom Metrics

```javascript
// In your code
const logger = new DebugLogger('MyComponent');
const timer = logger.time('custom-operation');

// Your operation here
await someOperation();

const duration = timer.end(); // Logs completion time
logger.info('Operation completed', { customMetric: duration });
```

### Add Custom Error Categories

Edit `analyze-logs.cjs` and add to the `analyzeErrorPatterns` function:

```javascript
else if (message.includes('your-custom-error')) category = 'CUSTOM_ERROR';
```

## 📈 Next Steps Based on Analysis

### If you see high Tebra faults

1. Implement circuit breaker pattern
2. Add exponential backoff retry logic
3. Consider caching for read operations
4. Contact Tebra support with specific error patterns

### If you see performance issues

1. Add response caching
2. Implement request batching
3. Optimize date range queries
4. Consider async processing for large operations

### If you see rate limiting

1. Implement client-side throttling
2. Add request queuing
3. Spread requests over time
4. Consider upgrading Tebra API limits

## 🔧 Deployment

The enhanced logging is automatically included when you deploy your Firebase Functions:

```bash
firebase deploy --only functions
```

The correlation IDs and enhanced error context will appear in your Cloud Logging console, making it easier to debug production issues.

## 📝 Log Retention

- **Local testing**: Logs appear in console
- **Firebase Functions**: Logs go to Cloud Logging (retained for 30 days by default)
- **Analysis reports**: Saved locally as JSON files for historical analysis

---

**Pro Tip**: Run the analysis script weekly to identify trends and catch issues before they become critical!
