# Firebase Functions v2 Initialization Fix

This repository contains Firebase Cloud Functions that have been updated to work with Firebase Functions v2. The main issue that was fixed was the initialization of Firebase Admin SDK before it was used in various modules.

## Changes Made

1. Added initialization guard to `src/monitoring.js`:
   ```javascript
   const admin = require('firebase-admin');
   if (!admin.apps.length) admin.initializeApp();
   ```

2. Added initialization guard to `src/services/firestoreDailySession.ts`:
   ```typescript
   import * as admin from 'firebase-admin';
   if (!admin.apps.length) admin.initializeApp();
   ```

## Why This Fix Was Needed

In Firebase Functions v2, each revision is its own Cloud Run container, and Firebase Admin is not automatically initialized. When modules that use Firebase Admin (like `monitoring.js`) are imported before the main initialization in `index.js`, they try to use Firebase Admin services before initialization, causing errors like:

```
Error: The default Firebase app does not exist. Make sure you call initializeApp()
```

## Deployment Instructions

To redeploy the fixed functions, use the following command:

```bash
gcloud functions deploy tebraTestConnection \
  --gen2 \
  --region=us-central1 \
  --project=luknerlumina-firebase \
  --runtime=nodejs20 \
  --entry-point=tebraTestConnection \
  --source=functions \
  --set-env-vars="TEBRA_CLOUD_RUN_URL=https://tebra-php-api-623450773640.us-central1.run.app,TEBRA_INTERNAL_API_KEY=$KEY"
```

Replace `$KEY` with your actual API key.

To deploy all four callables, you can use a loop:

```bash
for FUNCTION in tebraTestConnection tebraGetProviders tebraSyncTodaysSchedule tebraGetAppointments; do
  gcloud functions deploy "$FUNCTION" \
    --gen2 \
    --region=us-central1 \
    --project=luknerlumina-firebase \
    --runtime=nodejs20 \
    --entry-point="$FUNCTION" \
    --source=functions \
    --set-env-vars="TEBRA_CLOUD_RUN_URL=https://tebra-php-api-623450773640.us-central1.run.app,TEBRA_INTERNAL_API_KEY=$KEY"
done
```

## Validation

After deployment, you can validate that the functions are working correctly with:

```bash
curl -s -X POST -H "Content-Type: application/json"
     -d '{"data":{}}'
     https://us-central1-luknerlumina-firebase.cloudfunctions.net/tebraTestConnection | jq
```

You should see a successful response:

```json
{
  "result": {
    "success": true,
    "message": "Tebra API connection test successful",
    "timestamp": "2023-06-15T12:34:56.789Z"
  }
}
```

Once this works, the other callables should also succeed, and the React app / live Jest tests will be able to pull real schedules.
