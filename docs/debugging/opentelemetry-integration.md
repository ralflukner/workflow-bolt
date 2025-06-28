# OpenTelemetry Integration Guide

## Overview

This document describes the OpenTelemetry integration implemented in the Tebra API proxy system to provide enhanced tracing and debugging capabilities across PHP and Node.js services.

## Implementation Details

### Commit Information

- **Commit**: `2ad8229` - feat(tracing): Integrate OpenTelemetry for enhanced tracing and debugging
- **Date**: June 18, 2025
- **Author**: Ralf B Lukner MD PhD

### Key Features

1. **Cross-Service Tracing**: Enables seamless tracing between PHP API and Node.js Cloud Functions
2. **Correlation ID Generation**: Custom ID generator aligns traces across different services
3. **Enhanced Debug Logging**: Improved logging with correlation IDs and span context
4. **Deployment Automation**: Streamlined deployment process with proper configuration

## Architecture

### PHP API Integration (`tebra-php-api/`)

#### Files Modified

- `tebra-php-api/src/tracing.php` (107 lines) - Core OpenTelemetry implementation
- `tebra-php-api/public/index.php` (2 lines) - Tracing initialization
- `tebra-php-api/composer.json` (3 lines) - OpenTelemetry dependencies

#### Key Components

```php
// Custom ID generator for correlation
class CustomIdGenerator implements IdGeneratorInterface
{
    public function generateTraceId(): string
    {
        return sprintf('%016x%016x', mt_rand(), mt_rand());
    }

    public function generateSpanId(): string
    {
        return sprintf('%016x', mt_rand());
    }
}
```

### Node.js Cloud Functions Integration (`functions/`)

#### Files Modified

- `functions/src/debug-logger.js` (28 lines) - Enhanced logging with correlation IDs
- `functions/src/tracing.js` (82 lines) - Node.js tracing implementation
- `functions/otel-init.js` (66 lines) - OpenTelemetry initialization

#### Key Components

```javascript
// Enhanced debug logger with correlation ID support
const logger = {
    info: (message, metadata = {}) => {
        const correlationId = getCorrelationId();
        console.log(JSON.stringify({
            level: 'INFO',
            message,
            correlationId,
            timestamp: new Date().toISOString(),
            ...metadata
        }));
    }
};
```

## Deployment Configuration

### Deployment Script (`tebra-php-api/deploy-fix.sh`)

The deployment script includes:

- OpenTelemetry configuration setup
- Environment variable management
- Health check configuration
- Resource allocation (512Mi memory, 300s timeout)

### Environment Variables

Required environment variables for OpenTelemetry:

- `OTEL_SERVICE_NAME`: Service identifier
- `OTEL_TRACES_EXPORTER`: Trace exporter configuration
- `OTEL_METRICS_EXPORTER`: Metrics exporter configuration

## Usage Examples

### Starting a Trace in PHP

```php
$tracer = $tracingProvider->getTracer('tebra-api');
$span = $tracer->spanBuilder('api-request')->startSpan();
$scope = $span->activate();

try {
    // API logic here
    $span->setAttribute('request.type', 'soap');
    $span->setAttribute('request.endpoint', '/getPatients');
} finally {
    $scope->detach();
    $span->end();
}
```

### Correlating Traces in Node.js

```javascript
const { trace } = require('@opentelemetry/api');
const tracer = trace.getTracer('tebra-functions');

const span = tracer.startSpan('process-request');
span.setAttribute('correlation.id', correlationId);

try {
    // Process request
    span.setAttribute('request.status', 'success');
} catch (error) {
    span.setAttribute('request.status', 'error');
    span.recordException(error);
} finally {
    span.end();
}
```

## Monitoring and Debugging

### Viewing Traces

1. **Cloud Logging**: All traces are automatically sent to Google Cloud Logging
2. **Correlation ID Search**: Use correlation IDs to link related traces across services
3. **Error Tracking**: Enhanced error context with stack traces and metadata

### Debug Dashboard

The TebraDebugDashboard component provides:

- Real-time trace visualization
- Correlation ID tracking
- Error rate monitoring
- Performance metrics

## Best Practices

### 1. Correlation ID Management

- Always propagate correlation IDs across service boundaries
- Use consistent ID format across PHP and Node.js
- Include correlation IDs in all log entries

### 2. Span Naming

- Use descriptive span names that indicate the operation
- Include service name prefix for clarity
- Add relevant attributes for filtering and analysis

### 3. Error Handling

- Always record exceptions in spans
- Include error context and stack traces
- Set appropriate error attributes

### 4. Performance Monitoring

- Monitor span duration for performance bottlenecks
- Track resource usage and memory consumption
- Set up alerts for slow operations

## Troubleshooting

### Common Issues

1. **Missing Correlation IDs**
   - Ensure correlation IDs are properly propagated
   - Check HTTP headers for trace context
   - Verify ID generator configuration

2. **Trace Loss**
   - Check OpenTelemetry exporter configuration
   - Verify network connectivity to trace backend
   - Monitor trace buffer capacity

3. **Performance Impact**
   - Use sampling to reduce trace volume
   - Optimize span creation and management
   - Monitor memory usage of trace buffers

### Debug Commands

```bash
# View recent traces
gcloud logging read "resource.type=cloud_run_revision AND jsonPayload.trace_id:*" --limit=10

# Check correlation ID propagation
gcloud logging read "jsonPayload.correlationId:*" --limit=5

# Monitor error rates
gcloud logging read "severity>=ERROR" --limit=20
```

## Future Enhancements

1. **Metrics Integration**: Add custom metrics for business KPIs
2. **Distributed Tracing**: Extend tracing to external services
3. **Alerting**: Set up automated alerts for trace anomalies
4. **Dashboard**: Create dedicated tracing dashboard with Grafana

## Related Documentation

- [Tebra Debugging Strategy Guide](tebra-debugging-strategy-guide.md)
- [Tebra Debug Dashboard Guide](tebra-debug-dashboard-guide.md)
- [Recent Changes](recent-changes.md)
- [CHANGELOG](CHANGELOG.md)
