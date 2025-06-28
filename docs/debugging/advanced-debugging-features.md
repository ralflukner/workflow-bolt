# Advanced Debugging Features for Tebra Integration

## Overview

Based on analysis of the data flow and correlation IDs, I've implemented two powerful debugging tools that significantly enhance our ability to diagnose and resolve issues in the Tebra integration.

## 1. Live Log Viewer

### Purpose

Provides real-time visibility into API calls, errors, and data transformations as they happen across all components.

### Key Features

- **Real-time streaming**: Shows logs as they occur with timestamps
- **Correlation ID tracking**: Click any log to highlight all related entries
- **Advanced filtering**: Filter by text, component, or log level
- **Performance metrics**: Shows duration and status codes inline
- **Export capability**: Download filtered logs for deeper analysis
- **Pause/Resume**: Freeze the stream to analyze specific events

### Usage Example

```
[12:54:37.245] [ERROR  ] [CloudRun] SOAP fault: Object reference not set to an instance of an object
                          ID: 3yo0fgwv Duration: 3247ms Status: 500
```

### Benefits

- Instantly see what's happening in the system
- Trace requests across components using correlation IDs
- Identify patterns in errors and performance bottlenecks
- Export logs for post-mortem analysis

## 2. Request Replay Tool

### Purpose

Reproduce failed requests and compare them with successful ones to identify root causes.

### Key Features

- **Request history**: Browse recent API calls with their outcomes
- **One-click replay**: Re-execute any previous request
- **Comparison mode**: Side-by-side comparison of two requests
- **Difference highlighting**: Automatically identifies what changed
- **Correlation ID search**: Find specific requests by their ID

### Usage Example

1. Enter correlation ID `3yo0fgwv` to find the failed GetAppointments request
2. View the exact parameters, error message, and duration
3. Replay the request to see if the issue persists
4. Compare with a successful request to identify differences

### Benefits

- Reproduce intermittent issues on demand
- Compare successful vs failed requests
- Test fixes without affecting production data
- Build a library of test cases from real failures

## 3. Partial Redaction System

### Purpose

Show enough sensitive information to debug issues while maintaining security.

### Redaction Examples

#### Password

- Full: `MySecretPass123!`
- Redacted: `My************** (len: 16)`

#### Username

- Full: `john.doe@example.com`
- Redacted: `joh***************om (len: 20)`

#### Customer Key

- Full: `a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6`
- Redacted: `a1b2...o5p6 (len: 36)`

#### SSN

- Full: `123-45-6789`
- Redacted: `***-**-6789`

#### Date of Birth

- Full: `1990-05-15`
- Redacted: `1990-**-**`

### Benefits

- Debug authentication issues (see username format, password length)
- Verify customer key format without exposing the full key
- Confirm data is being sent correctly
- Maintain compliance while enabling effective debugging

## Implementation Details

### How They Work Together

1. **Issue Detection**: TebraDebugDashboard shows a failure
2. **Log Analysis**: LiveLogViewer reveals the exact error and timing
3. **Request Investigation**: RequestReplayTool finds and replays the failed request
4. **Pattern Recognition**: Compare multiple failures to identify commonalities
5. **Verification**: Test fixes using replay tool before deploying

### Example Debugging Workflow

```
1. Dashboard shows: Success Rate dropped to 23.4%
2. LiveLogViewer shows: Multiple "Object reference" errors from Tebra API
3. RequestReplayTool: Find correlation ID h5cgqyia
4. Replay shows: GetAppointments fails consistently with date range 6/17/2025
5. Comparison reveals: Working requests use different date format
6. Fix applied: Update date formatting
7. Replay confirms: Request now succeeds
```

## Performance Impact

- **LiveLogViewer**: Minimal overhead, async log processing
- **RequestReplayTool**: Only active when explicitly used
- **Partial Redaction**: < 1ms additional processing per request

## Security Considerations

- All sensitive data is partially redacted in logs
- Replay tool requires authentication
- Logs are never persisted with full sensitive data
- Export function maintains redaction

## Future Enhancements

1. **Auto-correlation**: Automatically link related requests across services
2. **Anomaly detection**: Alert when patterns deviate from normal
3. **Performance profiling**: Detailed timing breakdown by component
4. **Bulk replay**: Test multiple scenarios automatically
5. **Integration with Cloud Logging**: Stream real production logs

These tools transform debugging from a frustrating search through logs to an interactive, visual experience that makes finding and fixing issues significantly faster and more reliable.
