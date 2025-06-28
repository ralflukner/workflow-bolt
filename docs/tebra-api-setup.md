# Tebra API Integration Setup Guide

## Overview
This guide documents the setup and configuration of the Tebra API integration through Firebase Functions and Google Cloud Run.

## Architecture
- **Frontend**: React app calls Firebase Functions
- **Firebase Functions**: Acts as a proxy, handles authentication
- **Cloud Run Service**: PHP API that communicates with Tebra's SOAP API
- **Authentication**: Uses Google Identity Tokens + API Key

## Prerequisites
1. Firebase project with Functions enabled
2. Google Cloud Run service deployed
3. Service account with proper permissions
4. Tebra API credentials stored in Secret Manager

## Configuration

### 1. Environment Variables (.env file in functions directory)
```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-auth0-domain
AUTH0_AUDIENCE=your-auth0-audience

# Tebra Configuration
TEBRA_CLOUD_RUN_URL=https://your-cloud-run-service.run.app
TEBRA_INTERNAL_API_KEY=your-api-key

# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
```

### 2. Service Account Requirements
The service account needs the following:
- **Role**: `roles/run.invoker` on the Cloud Run service
- **File**: Must be accessible by Firebase Functions

### 3. Cloud Run Service Configuration
The Cloud Run service expects:
- **Authentication**: Google Identity Token (Bearer token)
- **Headers**: `X-API-Key` for additional security
- **Method**: POST requests with JSON body

## Common Issues and Solutions

### Issue 1: 401 Unauthorized from Cloud Run
**Symptoms**: 
- HTML error response instead of JSON
- "Your client does not have permission to the requested URL"

**Solution**:
1. Ensure service account has `roles/run.invoker` permission:
```bash
gcloud run services add-iam-policy-binding tebra-php-api \
  --member="serviceAccount:firebase-adminsdk-fbsvc@PROJECT.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --region=us-central1
```

2. Verify the API key is correct:
```bash
gcloud secrets versions access latest --secret="TEBRA_INTERNAL_API_KEY"
```

### Issue 2: Application Default Credentials in Emulator
**Symptoms**:
- Works with direct API calls but not through Firebase Functions
- Logs show personal Google account credentials being used

**Solution**:
Add this to the top of `functions/index.js`:
```javascript
if (process.env.FUNCTIONS_EMULATOR) {
  require('dotenv').config();
  
  // Force use of service account in emulator
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('/')) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = require('path').resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }
}
```

### Issue 3: 405 Method Not Allowed
**Symptoms**: 
- API returns "Method Not Allowed" error

**Solution**:
Ensure requests use POST method, not GET:
```javascript
// In tebra-proxy-client.js
let method = 'POST';  // Not 'GET'
let data = { action, params };
```

## Testing

### 1. Test with curl (local emulator)
```bash
curl -X POST http://127.0.0.1:5002/luknerlumina-firebase/us-central1/tebraTestConnection \
  -H "Content-Type: application/json" \
  -d '{"data": {}}'
```

### 2. Test Cloud Run directly
```bash
# Get identity token
gcloud auth activate-service-account --key-file=/path/to/service-account.json
TOKEN=$(gcloud auth print-identity-token --audiences=https://your-service.run.app)

# Test API
curl -X POST https://your-service.run.app/api \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"action": "getProviders", "params": {}}'
```

### 3. Verify service account permissions
```bash
gcloud run services get-iam-policy tebra-php-api \
  --region=us-central1 \
  --format=json | jq '.bindings'
```

## Security Best Practices
1. Never commit API keys or service account files
2. Use Secret Manager for production secrets
3. Restrict Cloud Run service to authenticated requests only
4. Use both Identity Tokens and API Keys for defense in depth
5. Monitor access logs for suspicious activity

## Troubleshooting Commands

### Check Firebase Functions logs
```bash
firebase functions:log --only tebraTestConnection -n 50
```

### Check Cloud Run logs
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

### Test service account
```bash
gcloud auth activate-service-account --key-file=service-account.json
gcloud auth list
```

## Important Files
- `/functions/src/tebra-proxy-client.js` - Main API client
- `/functions/index.js` - Firebase Functions definitions
- `/functions/.env` - Environment variables (not committed)
- `/config/service-account.json` - Service account credentials (not committed)