# Debugging Documentation

This directory contains comprehensive debugging guides, troubleshooting procedures, and monitoring documentation for Workflow Bolt.

## 📁 Contents

### Core Debugging Tools

- [Debug Toolkit](DEBUG-TOOLKIT.md) - Comprehensive debugging toolkit and procedures
- [Correlation ID Implementation](correlation-id-implementation.md) - Request tracing across services
- [OpenTelemetry Integration](opentelemetry-integration.md) - Distributed tracing setup

### Tebra-Specific Debugging

- [Tebra Debug Summary](TEBRA_DEBUG_SUMMARY.md) - Current Tebra sync issues and solutions
- [Tebra Fixes Summary](TEBRA_FIXES_SUMMARY.md) - Recent fixes applied to Tebra integration
- [Advanced Debugging Features](advanced-debugging-features.md) - Advanced techniques for Tebra debugging

### Monitoring & Observability

- [Monitoring Setup](MONITORING_SETUP.md) - Complete monitoring configuration guide
- [Debugging Tools Summary](debugging-tools-summary.md) - Overview of available debugging tools

### Troubleshooting Guides

- [Firebase Functions Startup Issue](FIREBASE_FUNCTIONS_STARTUP_ISSUE.md) - **RESOLVED**: Complete troubleshooting guide for Firebase Functions deployment failures
- [Firebase Failures](firebase-failures.md) - Common Firebase issues and solutions
- [Test Failures Summary](test-failures-summary.md) - Common test failures and fixes

## 🚀 Quick Debugging Workflows

### When Tebra Sync Fails

1. Check [Tebra Debug Summary](TEBRA_DEBUG_SUMMARY.md) for known issues
2. Use correlation IDs to trace requests (see [Correlation ID Implementation](correlation-id-implementation.md))
3. Check Cloud Run logs using commands in [Debug Toolkit](DEBUG-TOOLKIT.md)
4. Review [Tebra API Failures](tebra-api-failures.md) for error patterns

### For General Debugging

1. Start with [Debug Toolkit](DEBUG-TOOLKIT.md) for standard procedures
2. Enable OpenTelemetry tracing (see [OpenTelemetry Integration](opentelemetry-integration.md))
3. Check [Monitoring Setup](MONITORING_SETUP.md) for alerts configuration
4. Use [Advanced Debugging Features](advanced-debugging-features.md) for complex issues

### For Performance Issues

1. Review [OpenTelemetry Integration](opentelemetry-integration.md) for trace analysis
2. Check correlation IDs to identify slow operations
3. Use monitoring dashboards configured in [Monitoring Setup](MONITORING_SETUP.md)

## 🔍 Common Commands

### View Firebase Function Logs

```bash
firebase functions:log --only getTebra --lines 100
```

### Check Cloud Run Logs

```bash
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="tebra-php-api"' \
  --limit=50 --project=luknerlumina-firebase
```

### Find Logs by Correlation ID

```bash
gcloud logging read "jsonPayload.correlationId=\"YOUR_CORRELATION_ID\"" \
  --project=luknerlumina-firebase --limit=100
```

## 📊 Debugging Checklist

- [ ] Check error logs in Firebase Console
- [ ] Verify Cloud Run services are healthy
- [ ] Check Secret Manager permissions
- [ ] Validate API credentials
- [ ] Review recent deployments
- [ ] Check for rate limiting
- [ ] Verify network connectivity
- [ ] Review correlation ID traces

## 🔗 Related Documentation

- [Tebra Integration](../tebra-integration/) - Tebra-specific documentation
- [Security](../security/) - Security debugging and audit logs
- [Architecture](../architecture/) - System design for debugging context
- [Deployment](../deployment/) - Deployment issues and rollback procedures
