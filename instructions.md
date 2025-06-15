# Finding the Cloud Run Service URL Hash

## What is the Cloud Run URL Hash?

When you deploy a service to Google Cloud Run, it gets assigned a unique URL in the format:
```
https://SERVICE-NAME-HASH-REGION.a.run.app
```

For example:
```
https://tebra-php-api-a1b2c3d4e5-uc.a.run.app
```

In this URL:
- `tebra-php-api` is the service name
- `a1b2c3d4e5` is the hash (a unique identifier)
- `uc` is the region code (us-central1)

## How to Find the Cloud Run URL in Google Cloud Console

1. Open the [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're in the correct project (`luknerlumina-firebase`)
3. In the left navigation menu, go to **Cloud Run**
4. Find and click on your service (likely named `tebra-php-api`)
5. At the top of the service details page, you'll see the URL in the format:
   ```
   https://tebra-php-api-HASH-REGION.a.run.app
   ```
6. Copy this entire URL

## Using the URL in Firebase Functions Deployment

Once you have the Cloud Run URL, you can use it in the deployment command for Firebase Functions:

```bash
gcloud functions deploy tebraTestConnection \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=api \
  --set-env-vars="TEBRA_CLOUD_RUN_URL=https://tebra-php-api-HASH-REGION.a.run.app,TEBRA_INTERNAL_API_KEY=YOUR_KEY"
```

Replace:
- `https://tebra-php-api-HASH-REGION.a.run.app` with the actual URL you copied
- `YOUR_KEY` with your internal API key

## Alternative: Using gcloud CLI to Get the URL

If you prefer using the command line, you can run:

```bash
gcloud run services describe tebra-php-api --region=us-central1 --format='value(status.url)'
```

This will output the full URL of your Cloud Run service.

## Verifying the Connection

After deployment, you can test the connection:

```bash
curl -X POST -H "Content-Type: application/json" \
     -d '{}' \
     "https://REGION-PROJECT.cloudfunctions.net/tebraTestConnection"
```

You should receive a response like:
```json
{"data":{"success":true}}
```

This confirms that the Firebase Function can successfully connect to the Cloud Run service.