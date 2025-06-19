# Deploying Tebra PHP API to Cloud Run

## Prerequisites

1. Google Cloud SDK installed and configured
2. Project ID: `luknerlumina-firebase`
3. Appropriate permissions to create service accounts and deploy to Cloud Run

## Step 1: Create Secrets in Google Secret Manager

First, create the required secrets:

```bash
# Tebra API credentials
echo -n "your-tebra-username" | gcloud secrets create tebra-username --data-file=-
echo -n "your-tebra-password" | gcloud secrets create tebra-password --data-file=-
echo -n "your-customer-key" | gcloud secrets create tebra-customer-key --data-file=-

# Optional: Internal API key for additional security
echo -n "your-secure-api-key" | gcloud secrets create tebra-internal-api-key --data-file=-

# Optional: Admin debug token (for debug endpoint)
echo -n "your-admin-token" | gcloud secrets create tebra-admin-debug-token --data-file=-
```

## Step 2: Set up Service Account and Permissions

Run the setup script to create the service account and grant necessary permissions:

```bash
cd tebra-php-api
./setup-cloud-run.sh
```

This script will:

- Create a service account `tebra-php-api@luknerlumina-firebase.iam.gserviceaccount.com`
- Grant necessary roles (Secret Manager Secret Accessor, Cloud Run Invoker)
- Grant access to the secrets created in Step 1

## Step 3: Deploy to Cloud Run

Run the deployment script:

```bash
./deploy.sh
```

This will:

- Build the Docker container
- Deploy to Cloud Run in `us-central1`
- Configure memory, CPU, and timeout settings
- Return the service URL

## Step 4: Update Frontend Configuration

Update the Firestore document at `config/app` with the new service URL:

```javascript
// In Firebase Console or using Admin SDK
{
  "useTebraPhpApi": true,
  "tebraPhpApiUrl": "https://tebra-php-api-oqg3wfutka-uc.a.run.app/api"
}
```

## Step 5: Test the Deployment

### Health Check

```bash
curl https://tebra-php-api-oqg3wfutka-uc.a.run.app/api/health
```

### Test Connection (with API key if configured)

```bash
curl -X POST https://tebra-php-api-oqg3wfutka-uc.a.run.app/api/testConnection \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key"
```

## Monitoring and Logs

View logs in Cloud Console:

```bash
gcloud run services logs read tebra-php-api --region us-central1
```

Or stream logs:

```bash
gcloud run services logs tail tebra-php-api --region us-central1
```

## Troubleshooting

### 403 Forbidden Errors

- Ensure the service account has access to secrets
- Check that secrets exist in Secret Manager

### 500 Internal Server Error

- Check logs for specific error messages
- Verify all required secrets are created
- Ensure PHP extensions (SOAP, curl) are installed

### Connection Timeouts

- Tebra's SOAP API can be slow
- Default timeout is set to 300 seconds
- Can be adjusted in deploy.sh if needed

## Security Notes

1. The service is deployed with `--allow-unauthenticated` for easy frontend access
2. Use the internal API key for additional security
3. Debug endpoint requires both API key and admin token
4. All secrets are stored in Google Secret Manager
5. No sensitive data in environment variables or code

## Updating the Service

To update after code changes:

```bash
cd tebra-php-api
./deploy.sh
```

The deployment is zero-downtime - Cloud Run will gradually shift traffic to the new revision.
