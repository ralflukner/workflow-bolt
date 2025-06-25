# Tebra Integration Documentation

This directory contains comprehensive documentation for the Tebra EHR (Electronic Health Record) integration, including SOAP API implementation, debugging guides, and migration strategies.

## 📁 Contents

### Configuration & Setup

- [Tebra API URL Config](TEBRA_API_URL_CONFIG.md) - API endpoint configuration
- [Tebra Functions Usage](tebra-functions-usage.md) - How to use Tebra Firebase functions
- [Tebra Credential Rotation](tebra-credential-rotation.md) - Managing API credentials

### Architecture & Design

- [Tebra Cloud Run Design](tebra-cloudrun-design.md) - Cloud Run service architecture
- [Tebra PHP Migration](TEBRA_PHP_MIGRATION.md) - Migration from Node.js to PHP
- [Phase 1 SOAP Auth Fix Design](PHASE1_SOAP_AUTH_FIX_DESIGN.md) - Authentication fixes
- [Phase 2 Instrumentation Design](PHASE_2_INSTRUMENTATION_DESIGN.md) - Observability implementation

### Debugging & Troubleshooting

- [Tebra Integration Summary](tebra-integration-summary.md) - Overview of integration
- [Tebra Debugging Strategy](tebra-debugging-strategy-guide.md) - Comprehensive debugging guide
- [Tebra Debug Dashboard Guide](tebra-debug-dashboard-guide.md) - Using the debug dashboard
- [Tebra API Failures](tebra-api-failures.md) - Common failures and solutions
- [Tebra Support Ticket](tebra-support-ticket-revised.md) - Support communication template

### Development Resources

- [Tebra API Examples](tebra_api_examples.php) - PHP code examples
- [Tebra Support Request Reply](tebra_support_request_reply.txt) - Support correspondence

## 🏗️ Integration Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│ Firebase Function │────▶│  Cloud Run PHP  │
│                 │     │  (tebraProxy)     │     │      API        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │   Tebra SOAP    │
                                                  │      API        │
                                                  └─────────────────┘
```

## 🔑 Key Components

### 1. Firebase Function (tebraProxy)

- Authenticates requests
- Forwards to Cloud Run service
- Handles response transformation

### 2. Cloud Run PHP Service

- Makes SOAP API calls
- Manages rate limiting
- Implements retry logic
- Provides debug endpoints

### 3. Tebra SOAP API

- External EHR system
- Appointment management
- Patient data retrieval
- Provider information

## 🚀 Quick Start

### Testing Tebra Integration

```bash
# Test PHP API directly
./scripts/test-tebra-api-direct.sh

# Test Firebase function
./scripts/test-firebase-tebra-endpoint.sh

# Check debug dashboard
curl https://tebra-php-api-xccvzgogwa-uc.a.run.app/debug
```

### Common Operations

#### Sync Appointments

```javascript
// Frontend
await tebraService.syncAppointments(date);

// Firebase Function
const result = await tebraProxy({ 
  action: 'syncSchedule', 
  params: { date: '2025-06-25' } 
});
```

#### Get Providers

```javascript
const providers = await tebraProxy({ 
  action: 'getProviders' 
});
```

## 🐛 Debugging Workflows

### When Sync Fails

1. Check [Tebra API Failures](tebra-api-failures.md) for known issues
2. Review debug dashboard at `/debug` endpoint
3. Check Cloud Run logs:

   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="tebra-php-api"' \
     --limit=50 --project=luknerlumina-firebase
   ```

4. Verify credentials in Secret Manager
5. Check rate limiting status

### Performance Issues

1. Review [Tebra Debugging Strategy](tebra-debugging-strategy-guide.md)
2. Check OpenTelemetry traces
3. Monitor rate limit headers
4. Review caching effectiveness

## 📊 Key Metrics

- **API Response Time**: Target < 2s
- **Success Rate**: Target > 95%
- **Rate Limit**: 30 seconds between calls
- **Cache Hit Rate**: Target > 80%

## 🔐 Security Considerations

- All API calls use HTTPS
- Credentials stored in Secret Manager
- API key rotation every 90 days
- Audit logging for all PHI access
- No PHI in logs or error messages

## 🔗 Related Documentation

- [API Documentation](../api/) - General API docs
- [Security](../security/) - HIPAA compliance
- [Debugging](../debugging/) - General debugging tools
- [Architecture](../architecture/) - System design

## 📝 Maintenance Tasks

- **Daily**: Monitor error rates
- **Weekly**: Review performance metrics
- **Monthly**: Rotate API credentials
- **Quarterly**: Update Tebra API version

## 🚧 Known Issues

1. **Rate Limiting**: 30-second cooldown between API calls
2. **Timeout**: Long-running sync operations may timeout
3. **Data Consistency**: Appointments may take time to appear
4. **SOAP Complexity**: Error messages can be cryptic

## 📞 Support Contacts

- **Tebra Support**: See [Support Ticket Template](tebra-support-ticket-revised.md)
- **Internal Team**: Check CLAUDE.md for escalation
- **Emergency**: Use incident response procedure
