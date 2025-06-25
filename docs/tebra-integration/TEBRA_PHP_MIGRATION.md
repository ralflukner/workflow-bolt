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

### 1. Google Secret Manager (GSM)

All configuration is managed through Google Secret Manager. No .env files are used.

**PHP API Secrets (stored in GSM):**

- `tebra-username` - Tebra API username
- `tebra-password` - Tebra API password  
- `tebra-customer-key` - Tebra customer key
- `tebra-internal-api-key` - Optional API key for securing PHP endpoints

**Frontend Configuration (stored in Firestore):**
Create a document at `config/app` with:

```json
{
  "useTebraPhpApi": true,
  "tebraPhpApiUrl": "https://tebra-php-api-oqg3wfutka-uc.a.run.app/api"
}
```

### 2. Setting up Secrets in GSM

```bash
# Create secrets in Google Secret Manager
echo -n "your-tebra-username" | gcloud secrets create tebra-username --data-file=-
echo -n "your-tebra-password" | gcloud secrets create tebra-password --data-file=-
echo -n "your-customer-key" | gcloud secrets create tebra-customer-key --data-file=-
echo -n "your-api-key" | gcloud secrets create tebra-internal-api-key --data-file=-

# Grant Cloud Run service account access to secrets
gcloud secrets add-iam-policy-binding tebra-username \
  --member="serviceAccount:YOUR-SERVICE-ACCOUNT@PROJECT-ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Deploying the PHP API

The PHP API is located in `/tebra-php-api` and needs to be deployed to Cloud Run:

```bash
cd tebra-php-api
gcloud run deploy tebra-php-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=your-project-id
```

The PHP API will automatically read secrets from GSM.

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

The frontend automatically uses the PHP API based on Firestore configuration. No environment variables are needed.

All existing code using `tebraApiService` has been updated to use the new `tebraApi` service which automatically routes to either Firebase Functions or PHP API based on the Firestore configuration.

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

1. **Google Secret Manager**: All sensitive credentials are stored in GSM, not in code or environment variables
2. **API Key Protection**: The PHP API uses internal API keys (from GSM) for authentication between services
3. **CORS**: Currently allows all origins - should be restricted in production
4. **HTTPS**: Always use HTTPS in production
5. **Service Account Permissions**: Cloud Run service account needs `roles/secretmanager.secretAccessor` role

## Troubleshooting

### Common Issues

1. **Connection Timeout**: Tebra's SOAP API can be slow. The PHP client has appropriate timeouts configured.

2. **Authentication Failed**: Verify credentials in Cloud Run environment variables or Secret Manager.

3. **CORS Errors**: Check that the PHP API URL is correctly configured in React app.

4. **Missing Functions**: Some Firebase Functions features (like real-time sync) are not yet implemented in PHP.

## Migration Status

✅ **Completed**:

- ✅ All Node.js Tebra endpoints removed from Firebase Functions
- ✅ PHP API with all core endpoints (get, search, create, update)
- ✅ Frontend uses PHP API exclusively
- ✅ Configuration via Firestore/GSM (no .env files)
- ✅ Error handling and logging
- ✅ Automatic secret retrieval from GSM
- ✅ Removed all Node.js Tebra-related files
- ✅ Updated all imports to use PHP-only service

❌ **Not Yet Implemented**:

- Real-time sync functionality
- Batch operations
- Webhook support

## Important Note

**Node.js support for Tebra has been completely removed**. The Tebra SOAP API only works reliably with PHP. All attempts to use Node.js with Tebra's SOAP API fail due to compatibility issues.

## Next Steps

1. Create secrets in Google Secret Manager
2. Deploy PHP API to Cloud Run
3. Create Firestore config document at `config/app`
4. Grant service account permissions
5. Test all functionality
6. Monitor logs for any issues

## Configuration Management

To update configuration:

```javascript
// In browser console (with appropriate permissions)
const db = firebase.firestore();
await db.collection('config').doc('app').set({
  useTebraPhpApi: true,
  tebraPhpApiUrl: 'https://your-php-api-url/api'
}, { merge: true });
```
