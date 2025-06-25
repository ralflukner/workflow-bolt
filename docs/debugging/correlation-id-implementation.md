# Correlation ID Implementation for Error Tracing

## Overview

This document describes the implementation of correlation IDs across all error responses in the Tebra PHP API (`tebra-php-api/public/index.php`) to ensure consistent tracing and debugging capabilities.

## Problem Statement

Previously, only the generic error handler (Throwable catch block) included a correlation ID in the response. This created inconsistent error tracking across different error types, making it difficult to trace and debug issues effectively.

## Solution Implementation

### 1. **Helper Functions Added**

Two utility functions were added at the top of the file:

```php
/**
 * Generate a correlation ID for error tracking
 * @param string $prefix Prefix for the correlation ID
 * @return string Unique correlation ID
 */
function generateCorrelationId(string $prefix = 'error'): string {
    return uniqid($prefix . '_', true);
}

/**
 * Log error with correlation ID for consistent tracing
 * @param string $level Error level (e.g., 'TEBRA_SOAP_FAULT', 'TEBRA_CONFIG_ERROR')
 * @param array $errorDetails Error details to log
 * @param string $correlationId Correlation ID for tracing
 */
function logErrorWithCorrelation(string $level, array $errorDetails, string $correlationId): void {
    $errorDetails['correlation_id'] = $correlationId;
    error_log("[$level] " . json_encode($errorDetails));
}
```

### 2. **Error Response Structure Standardization**

All error responses now follow a consistent structure:

```json
{
  "success": false,
  "error": "Error message description",
  "type": "error_type_identifier",
  "timestamp": "2024-01-15T10:30:00Z",
  "correlation_id": "error_abc123def456"
}
```

### 3. **Error Types Covered**

#### **Authentication Errors**

- **Type**: `authentication_error`
- **HTTP Code**: 401
- **Trigger**: Invalid API key
- **Correlation ID**: `error_*`

#### **Method Errors**

- **Type**: `method_error`
- **HTTP Code**: 405
- **Trigger**: Invalid HTTP method
- **Correlation ID**: `error_*`

#### **JSON Parsing Errors**

- **Type**: `json_error`
- **HTTP Code**: 400
- **Trigger**: Invalid JSON in request body
- **Correlation ID**: `error_*`

#### **Validation Errors**

- **Type**: `validation_error`
- **HTTP Code**: 400
- **Trigger**: InvalidArgumentException
- **Correlation ID**: `error_*`

#### **SOAP Fault Errors**

- **Type**: `soap_fault`
- **HTTP Code**: 503
- **Trigger**: Tebra SOAP API errors
- **Correlation ID**: `error_*`

#### **Configuration Errors**

- **Type**: `configuration_error`
- **HTTP Code**: 500
- **Trigger**: RuntimeException (configuration issues)
- **Correlation ID**: `error_*`

#### **Internal Errors**

- **Type**: `internal_error`
- **HTTP Code**: 500
- **Trigger**: Throwable (unexpected errors)
- **Correlation ID**: `error_*`

### 4. **Debug Endpoint Errors**

#### **Debug Configuration Errors**

- **Type**: `debug_config_error`
- **HTTP Code**: 503
- **Trigger**: Missing admin token configuration
- **Correlation ID**: `error_*`

#### **Debug Authentication Errors**

- **Type**: `debug_auth_error`
- **HTTP Code**: 401
- **Trigger**: Invalid debug credentials
- **Correlation ID**: `error_*`

#### **Debug Mode Errors**

- **Type**: `debug_disabled_error`
- **HTTP Code**: 403
- **Trigger**: Debug mode disabled
- **Correlation ID**: `error_*`

#### **Debug Rate Limit Errors**

- **Type**: `debug_rate_limit_error`
- **HTTP Code**: 429
- **Trigger**: Rate limit exceeded
- **Correlation ID**: `error_*`

## Benefits

### 1. **Consistent Tracing**

- All error responses now include correlation IDs
- Enables end-to-end request tracing
- Facilitates debugging across different error types

### 2. **Improved Logging**

- Centralized error logging with correlation IDs
- Consistent log format across all error types
- Better integration with monitoring systems

### 3. **Enhanced Debugging**

- Correlation IDs can be used to correlate client errors with server logs
- Easier to track error patterns and frequency
- Better support for distributed tracing

### 4. **Monitoring Integration**

- Correlation IDs can be used in monitoring dashboards
- Enables alerting based on correlation ID patterns
- Better error tracking and reporting

## Usage Examples

### Client Error Handling

```javascript
// Example client-side error handling
fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
.then(response => response.json())
.then(data => {
  if (!data.success) {
    console.error(`Error: ${data.error}`);
    console.error(`Correlation ID: ${data.correlation_id}`);
    console.error(`Error Type: ${data.type}`);

    // Log correlation ID for debugging
    logErrorWithCorrelation(data.correlation_id, data);
  }
});
```

### Server-Side Logging

```php
// All error logs now include correlation IDs
// Example log entry:
// [TEBRA_SOAP_FAULT] {"success":false,"error":"Tebra API Error","correlation_id":"error_abc123def456"}
```

### Monitoring Queries

```sql
-- Example monitoring query to track errors by correlation ID
SELECT 
  correlation_id,
  error_type,
  COUNT(*) as error_count,
  MIN(timestamp) as first_occurrence,
  MAX(timestamp) as last_occurrence
FROM error_logs 
WHERE correlation_id LIKE 'error_%'
GROUP BY correlation_id, error_type
ORDER BY error_count DESC;
```

## Migration Notes

### Before Implementation

- Only generic errors had correlation IDs
- Inconsistent error response structure
- Difficult to trace specific error types

### After Implementation

- All error responses include correlation IDs
- Consistent error response structure
- Enhanced tracing and debugging capabilities

## Testing

### Error Response Validation

```bash
# Test authentication error
curl -H 'X-API-Key: invalid-key' \
     -X POST \
     -H 'Content-Type: application/json' \
     -d '{"action":"test"}' \
     http://localhost:8080/

# Expected response:
# {
#   "success": false,
#   "error": "Unauthorized",
#   "type": "authentication_error",
#   "timestamp": "2024-01-15T10:30:00Z",
#   "correlation_id": "error_abc123def456"
# }
```

### Correlation ID Uniqueness

```php
// Verify correlation IDs are unique
$correlationIds = [];
for ($i = 0; $i < 1000; $i++) {
    $correlationIds[] = generateCorrelationId('test');
}
$uniqueCount = count(array_unique($correlationIds));
assert($uniqueCount === 1000, 'Correlation IDs must be unique');
```

## Future Enhancements

1. **OpenTelemetry Integration**: Link correlation IDs with OpenTelemetry traces
2. **Error Aggregation**: Group similar errors by correlation ID patterns
3. **Performance Monitoring**: Track error response times by correlation ID
4. **Client-Side Integration**: Provide client libraries for correlation ID handling

## Conclusion

The implementation of correlation IDs across all error responses provides a robust foundation for error tracing and debugging. This enhancement significantly improves the observability of the Tebra PHP API and enables better error monitoring and resolution.
