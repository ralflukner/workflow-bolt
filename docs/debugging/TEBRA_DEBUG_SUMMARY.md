# Tebra Sync Debug Summary

## Current Status

- **Issue**: Tebra sync showing "Unknown error" with 0 appointments returned
- **Date**: June 25, 2025

## Architecture Overview

1. **Frontend** (React) → Makes request to sync appointments
2. **Firebase Functions** (`getTebra`) → Authenticates and forwards request
3. **Cloud Run PHP API** (`tebra-php-api`) → Calls Tebra SOAP API
4. **Tebra SOAP API** → Returns appointment data

## Key Findings

### 1. PHP API Service Status

- **Service**: `tebra-php-api` deployed to Cloud Run
- **URL**: <https://tebra-php-api-xccvzgogwa-uc.a.run.app>
- **Authentication**: Required (HIPAA compliant)
- **Recent Fix**: Fixed PHP error in `compareAppointmentData` function

### 2. Available Endpoints

- `/api/testConnection`
- `/api/getAppointments`
- `/api/getProviders`
- `/api/getPatient`
- `/api/searchPatients`
- `/api/createAppointment`
- `/api/updateAppointment`
- `/api/syncSchedule`

### 3. Secret Manager Configuration

All Tebra credentials are stored in Google Secret Manager:

- `TEBRA_USERNAME`
- `TEBRA_PASSWORD`
- `TEBRA_CUSTOMER_KEY`
- `TEBRA_PRACTICE_ID`
- `TEBRA_WSDL_URL`
- `TEBRA_PHP_API_URL`
- `TEBRA_PHP_API_KEY`

### 4. Debug Features Added

- Enhanced logging in PHP API with `debug=true` parameter
- Comparison between real API data and hardcoded test data
- Rate limiting information (30-second cooldown between API calls)
- Detailed error messages and stack traces

## Next Steps to Debug

### 1. Check Firebase Functions Integration

```bash
# View Firebase Functions logs
firebase functions:log --only getTebra --lines 100

# Check if Firebase Function is calling PHP API correctly
gcloud logging read 'resource.type="cloud_function" AND labels.function_name="getTebra"' --limit=20 --project=luknerlumina-firebase
```

### 2. Test PHP API with Authentication

```bash
# Get an access token
TOKEN=$(gcloud auth print-access-token)

# Test the PHP API
curl -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://tebra-php-api-xccvzgogwa-uc.a.run.app/api/getAppointments?fromDate=2025-06-25&toDate=2025-06-25&debug=true"
```

### 3. Check Tebra Credentials

```bash
# Verify credentials are set correctly
gcloud secrets versions access latest --secret="TEBRA_USERNAME" --project=luknerlumina-firebase
gcloud secrets versions access latest --secret="TEBRA_PRACTICE_ID" --project=luknerlumina-firebase
```

### 4. Frontend Debug Mode

The frontend should be calling the Firebase Function with proper authentication. Check:

1. Network tab in browser DevTools
2. Look for `getTebra` requests
3. Check request headers for Authorization token
4. Review response for error details

## Common Issues and Solutions

### Issue 1: Rate Limiting

- **Symptom**: Getting hardcoded data instead of real data
- **Solution**: Wait 30 seconds between API calls

### Issue 2: Authentication Failures

- **Symptom**: 401 or 403 errors
- **Solution**: Ensure Firebase Auth token is valid and being passed correctly

### Issue 3: Wrong Practice ID

- **Symptom**: No appointments returned even when they exist
- **Solution**: Verify TEBRA_PRACTICE_ID matches your Tebra account

### Issue 4: SOAP API Changes

- **Symptom**: Unexpected response format
- **Solution**: Check Tebra API documentation for updates

## Test Scripts Created

1. `scripts/get-firebase-token.js` - Generate Firebase auth tokens
2. `scripts/test-firebase-tebra-endpoint.sh` - Test Firebase Functions
3. `scripts/test-tebra-api-direct.sh` - Test PHP API directly
4. `scripts/test-tebra-api-debug.sh` - Enhanced debug testing

## Security Notes

- PHP API requires authentication (no public access)
- All credentials stored in Secret Manager
- HIPAA compliance maintained
- Rate limiting prevents API abuse
