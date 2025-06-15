# Gmail OAuth2 Secrets for Google Secret Manager

This document explains how to store and use Gmail OAuth2 credentials in Google Secret Manager for the Workflow Bolt application.

## Overview

The application uses Gmail OAuth2 credentials to send emails through Google Workspace. These credentials need to be securely stored in Google Secret Manager to ensure they are not exposed in the codebase or environment variables.

## Stored Secrets

The following OAuth2 secrets are stored in Google Secret Manager:

1. `GMAIL_CLIENT_ID` - The OAuth2 Email Client ID
2. `GMAIL_CLIENT_SECRET` - The OAuth2 Client Secre

## Creating the Secrets

To create these secrets in Google Secret Manager, run the provided script:

```bash
# Make the script executable
chmod +x scripts/create-gmail-oauth-secrets.sh

# Run the scrip
./scripts/create-gmail-oauth-secrets.sh
```

This script will:
1. Create the secrets in Google Secret Manager if they don't already exis
2. Grant access to the service account used by the application

## Using the Secrets in the Application

### In Firebase Functions

When deploying Firebase Functions, you need to set these secrets as environment variables:

```bash
gcloud functions deploy FUNCTION_NAME \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1
  --set-env-vars="GMAIL_CLIENT_ID=$(gcloud secrets versions access latest --secret=GMAIL_CLIENT_ID),GMAIL_CLIENT_SECRET=$(gcloud secrets versions access latest --secret=GMAIL_CLIENT_SECRET)"
```

Replace `FUNCTION_NAME` with the name of your function.

### In the Email Service

The email service (`functions/src/services/emailService.js`) is already configured to use these environment variables:

```javascrip
const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;
```

No additional code changes are needed to use these secrets.

## Generating a Refresh Token

In addition to the client ID and client secret, you'll need a refresh token to use Gmail OAuth2. Follow these steps to generate a refresh token:

1. Go to the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in the top right corner
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secre
5. Close the settings
6. Select "Gmail API v1" > "https://mail.google.com/" from the lis
7. Click "Authorize APIs"
8. Sign in with the Google Workspace accoun
9. Grant the requested permissions
10. Click "Exchange authorization code for tokens"
11. Note the Refresh Token

Once you have the refresh token, you can store it in Google Secret Manager:

@@ -78,4 +78,8 @@
echo -n "YOUR_REFRESH_TOKEN" | \
  gcloud secrets create GMAIL_REFRESH_TOKEN \
    --project=luknerlumina-firebase \
    --replication-policy="automatic"
  --data-file=-
```

Then grant access to the service account:

@@ -88,3 +88,5 @@
gcloud secrets add-iam-policy-binding GMAIL_REFRESH_TOKEN \
  --project=luknerlumina-firebase \
  --member="serviceAccount:tebra-cloud-run-sa@luknerlumina-firebase.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Include the refresh token when deploying Firebase Functions:

```bash
gcloud functions deploy FUNCTION_NAME
  --gen2
  --runtime=nodejs20
  --region=us-central1
  --set-env-vars="GMAIL_CLIENT_ID=$(gcloud secrets versions access latest --secret=GMAIL_CLIENT_ID),GMAIL_CLIENT_SECRET=$(gcloud secrets versions access latest --secret=GMAIL_CLIENT_SECRET),GMAIL_REFRESH_TOKEN=$(gcloud secrets versions access latest --secret=GMAIL_REFRESH_TOKEN)"
```

## Security Considerations

- Never commit OAuth2 credentials to version control
- Regularly rotate the client secret and refresh token
- Monitor access to these secrets in Google Cloud Console
- Use the principle of least privilege when granting access to these secrets