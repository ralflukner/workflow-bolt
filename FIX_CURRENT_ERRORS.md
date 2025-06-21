# Fix Current Errors

## 1. Fix 401 Unauthorized Error

The PHP API is returning 401 because it's checking for an internal API key that hasn't been set up in Google Secret Manager.

### Option A: Set up the API key in Google Secret Manager (Recommended for production)

```bash
# Set the internal API key in Google Secret Manager
echo -n "UlmgPDMHoMqP2KAMKGIJK4tudPlm7z7ertoJ6eTV3+Y=" | gcloud secrets create tebra-internal-api-key --data-file=- --project=luknerlumina-firebase

# Grant the Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding tebra-internal-api-key \
  --member="serviceAccount:tebra-php-api@luknerlumina-firebase.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=luknerlumina-firebase
```

### Option B: Set environment variable in Cloud Run (Quick fix)

```bash
# Update the Cloud Run service with the API key as an environment variable
gcloud run services update tebra-php-api \
  --update-env-vars="INTERNAL_API_KEY=UlmgPDMHoMqP2KAMKGIJK4tudPlm7z7ertoJ6eTV3+Y=" \
  --region=us-central1 \
  --project=luknerlumina-firebase
```

### Option C: Disable API key check temporarily (Development only)

Edit the PHP API to bypass the check temporarily. DO NOT use this in production.

## 2. Fix Malformed UTF-8 Data Error

This error occurs because patient data in Firebase was encrypted with a different key than what's currently set.

### Option A: Clear old encrypted data (if it's test data)

```javascript
// Run this in the browser console to clear old sessions
// WARNING: This will delete all patient data!
const { getFirestore, collection, getDocs, deleteDoc } = await import('firebase/firestore');
const db = getFirestore();
const sessionsRef = collection(db, 'sessions');
const snapshot = await getDocs(sessionsRef);
snapshot.forEach(doc => {
  console.log('Deleting session:', doc.id);
  deleteDoc(doc.ref);
});
```

### Option B: Re-encrypt data with new key

Create a migration script to re-encrypt all data with the new key.

### Option C: Use the old encryption key temporarily

If you know the old encryption key, you can temporarily set it in .env.local to decrypt the data.

## 3. Component Re-rendering Issues

The PatientContext is mounting/unmounting repeatedly. This is likely due to the parent component re-rendering.

To debug:

1. Check if the Dashboard component has unstable dependencies
2. Look for missing dependencies in useEffect hooks
3. Check if Auth0 is causing re-renders during authentication

## Quick Workaround

For immediate testing, you can:

1. **Disable authentication temporarily** in the PHP API by commenting out lines 201-214 in `/tebra-php-api/public/index.php`
2. **Clear browser localStorage and Firebase data** to start fresh
3. **Restart the development server**

## Next Steps

1. Set up the internal API key properly in Google Secret Manager
2. Decide how to handle the encrypted data (migrate or start fresh)
3. Fix the component re-rendering issues
4. Set up proper monitoring and error tracking
