# Tebra PHP API Migration Guide

## Overview

This guide explains how to migrate from the Node.js/Firebase Functions implementation to the PHP-based Tebra API.

## Why PHP?

As confirmed by the user, **Tebra's SOAP API only works reliably with PHP**. Node.js implementations fail 100% of the time due to compatibility issues with Tebra's SOAP implementation.

## Architecture Changes

### Before (Node.js/Firebase Functions)
```
React App → Firebase Functions (Node.js) → Tebra SOAP API ❌
```

### After (PHP Direct)
```
React App → PHP API (Cloud Run) → Tebra SOAP API ✅
```

## Configuration

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# Enable PHP API
REACT_APP_USE_TEBRA_PHP_API=true

# PHP API URL (your Cloud Run service URL)
REACT_APP_TEBRA_PHP_API_URL=https://tebra-php-api-oqg3wfutka-uc.a.run.app/api
```

### 2. Deploying the PHP API

The PHP API is located in `/tebra-php-api` and needs to be deployed to Cloud Run:

```bash
cd tebra-php-api
gcloud run deploy tebra-php-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars TEBRA_USERNAME=xxx,TEBRA_PASSWORD=xxx,TEBRA_CUSTOMER_KEY=xxx
```

## API Endpoints

The PHP API provides the following endpoints:

- `GET /api/health` - Health check
- `POST /api/testConnection` - Test Tebra connection
- `POST /api/getPatient` - Get patient by ID
- `POST /api/searchPatients` - Search patients by last name
- `POST /api/getAppointments` - Get appointments for date range
- `POST /api/getProviders` - Get all providers
- `POST /api/createAppointment` - Create new appointment
- `POST /api/updateAppointment` - Update existing appointment

## Frontend Usage

The frontend automatically uses the PHP API when `REACT_APP_USE_TEBRA_PHP_API=true`. 

All existing code using `tebraApiService` has been updated to use the new `tebraApi` service which automatically routes to either Firebase Functions or PHP API based on configuration.

```typescript
import tebraApi from '../services/tebraApi';

// Works with both Firebase Functions and PHP API
const result = await tebraApi.testConnection();
const providers = await tebraApi.getProviders();
const appointments = await tebraApi.getAppointments({ 
  fromDate: '2025-06-18', 
  toDate: '2025-06-19' 
});
```

## Testing

### Local Testing

1. Start the PHP development server:
```bash
cd tebra-php-api
php -S localhost:8080 -t public
```

2. Test endpoints:
```bash
# Health check
curl http://localhost:8080/api/health

# Test connection (requires environment variables)
curl -X POST http://localhost:8080/api/testConnection
```

### Using the Test Script

```bash
php tebra-tools/test-tebra.php
```

## Security Considerations

1. **API Key Protection**: The PHP API uses internal API keys for authentication between services
2. **CORS**: Currently allows all origins - should be restricted in production
3. **Secrets**: Uses Google Secret Manager for sensitive credentials
4. **HTTPS**: Always use HTTPS in production

## Troubleshooting

### Common Issues

1. **Connection Timeout**: Tebra's SOAP API can be slow. The PHP client has appropriate timeouts configured.

2. **Authentication Failed**: Verify credentials in Cloud Run environment variables or Secret Manager.

3. **CORS Errors**: Check that the PHP API URL is correctly configured in React app.

4. **Missing Functions**: Some Firebase Functions features (like real-time sync) are not yet implemented in PHP.

## Migration Status

✅ **Completed**:
- Core API endpoints (get, search, create, update)
- Frontend service abstraction
- Environment-based routing
- Error handling and logging

❌ **Not Yet Implemented**:
- Real-time sync functionality
- Batch operations
- Webhook support

## Next Steps

1. Deploy PHP API to Cloud Run
2. Update environment variables
3. Test all functionality
4. Monitor logs for any issues
5. Implement missing features as needed