# Update Firestore Configuration

Since firebase-admin is not installed in the main project, you can update the configuration in one of these ways:

## Option 1: Use Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/project/luknerlumina-firebase/firestore/data)
2. Navigate to the `config` collection
3. Click on the `app` document
4. Update or add these fields:
   - `useTebraPhpApi`: `true` (boolean)
   - `tebraPhpApiUrl`: `https://tebra-php-api-xccvzgogwa-uc.a.run.app/api` (string)

## Option 2: Use gcloud CLI

```bash
gcloud firestore documents update config/app \
  --project=luknerlumina-firebase \
  --data='{"useTebraPhpApi": true, "tebraPhpApiUrl": "https://tebra-php-api-xccvzgogwa-uc.a.run.app/api"}'
```

## Option 3: From the App's Browser Console

Open your React app in the browser, open the developer console (F12), and run:

```javascript
// Assuming Firebase is already initialized in your app
const db = firebase.firestore();
await db.collection('config').doc('app').set({
  useTebraPhpApi: true,
  tebraPhpApiUrl: 'https://tebra-php-api-xccvzgogwa-uc.a.run.app/api'
}, { merge: true });
console.log('✅ Configuration updated!');
```

## Option 4: Create the Document via REST API

```bash
curl -X PATCH \
  "https://firestore.googleapis.com/v1/projects/luknerlumina-firebase/databases/(default)/documents/config/app?updateMask.fieldPaths=useTebraPhpApi&updateMask.fieldPaths=tebraPhpApiUrl" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "useTebraPhpApi": {"booleanValue": true},
      "tebraPhpApiUrl": {"stringValue": "https://tebra-php-api-xccvzgogwa-uc.a.run.app/api"}
    }
  }'
```

## Verify the Configuration

After updating, you can verify by:

1. Checking in Firebase Console
2. Or running this in your app's browser console:
   ```javascript
   const doc = await firebase.firestore().collection('config').doc('app').get();
   console.log('Current config:', doc.data());
   ```
