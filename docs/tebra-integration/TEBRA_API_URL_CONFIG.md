# Tebra PHP API URL Configuration

## IMPORTANT: Current Production URL

**The correct Tebra PHP API URL is:**

```
https://tebra-php-api-623450773640.us-central1.run.app
```

## URL History

1. **Old URL (deprecated):** `https://tebra-php-api-oqg3wfutka-uc.a.run.app/api`
   - This was the initial deployment URL
   - No longer active

2. **Current URL (active):** `https://tebra-php-api-623450773640.us-central1.run.app`
   - Deployed to Cloud Run in project: luknerlumina-firebase
   - Region: us-central1
   - Service name: tebra-php-api

## Where This URL is Configured

The URL is configured in multiple places:

### 1. Frontend Configuration

- **File:** `src/services/configService.ts`
- **Lines:** 38, 65
- Used as default fallback when Firebase config is not available

### 2. Firebase Remote Config (if enabled)

- Can override the default URL
- Access via Firebase Console > Remote Config

### 3. Firestore Configuration (if enabled)

- Document: `config/app`
- Field: `tebraPhpApiUrl`

### 4. Environment Variables (for local development)

- Can set `VITE_TEBRA_PHP_API_URL` in `.env.local`
- This overrides the default URL during development

## How to Update the URL

If the Cloud Run service is redeployed and gets a new URL:

1. **Update `src/services/configService.ts`:**
   - Update lines 38 and 65 with the new URL
   - Update the comments to document the change

2. **Update Firebase Remote Config (if using):**
   ```bash
   firebase remoteconfig:set tebraPhpApiUrl "https://new-url.run.app"
   ```

3. **Update Firestore (if using):**
   ```javascript
   await configService.updateConfig({
     tebraPhpApiUrl: 'https://new-url.run.app'
   });
   ```

## API Endpoint Format

The PHP API expects POST requests with this format:

```json
{
  "action": "actionName",
  "params": {
    // action-specific parameters
  }
}
```

Available actions:

- `testConnection` - Test API connectivity
- `getAppointments` - Get appointments (requires fromDate, toDate)
- `getProviders` - Get all providers
- `getPatient` - Get patient by ID
- `searchPatients` - Search patients by last name
- `createAppointment` - Create new appointment
- `updateAppointment` - Update existing appointment
- `health` - Health check

## Troubleshooting

If API calls are failing:

1. **Check the URL:** Ensure you're using the current URL listed above
2. **Check CORS:** The PHP API should handle OPTIONS requests
3. **Check Authentication:** Include `X-API-Key` header if configured
4. **Check Request Format:** Must be POST with JSON body containing `action` and `params`

## Deployment Commands

To redeploy the PHP API:

```bash
cd tebra-php-api
gcloud run deploy tebra-php-api \
  --source . \
  --region us-central1 \
  --project luknerlumina-firebase \
  --allow-unauthenticated
```

After deployment, check the output for the new service URL and update configurations accordingly.
