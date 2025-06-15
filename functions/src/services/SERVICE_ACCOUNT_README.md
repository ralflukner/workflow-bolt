# Service Account Email Service for HIPAA Security Alerts

This document explains how to set up and use the Service Account Email Service for sending HIPAA security alerts through Google Workspace (Gmail).

## Overview

The Service Account Email Service uses a production-grade approach (Service Account + Domain-Wide Delegation) as recommended for HIPAA environments. This approach:

- Uses a service account to authenticate with Google APIs
- Impersonates a user (lukner@luknerclinic.com) using domain-wide delegation
- Does not require storing refresh tokens
- Uses the service account's private key to obtain access tokens on demand

## Setup Instructions

### 1. Create a Service Account in Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (luknerlumina-firebase)
3. Navigate to "IAM & Admin" > "Service Accounts"
4. Click "Create Service Account"
5. Enter a name (e.g., "Gmail Service Account") and description
6. Click "Create and Continue"
7. For the role, select "Basic" > "Viewer" (minimal permissions needed)
8. Click "Continue" and then "Done"
9. Find the newly created service account in the list and click on i
10. Go to the "Keys" tab
11. Click "Add Key" > "Create new key"
12. Select "JSON" as the key type and click "Create"
13. The key file will be downloaded to your computer
14. Note the service account email address (e.g., gmail-service-account@luknerlumina-firebase.iam.gserviceaccount.com)

### 2. Enable Domain-Wide Delegation for the Service Accoun

1. Go back to the service account details page
2. Click "Edit" at the top of the page
3. Check the box for "Enable Google Workspace Domain-wide Delegation"
4. Enter a product name for the consent screen (e.g., "HIPAA Security Alerts")
5. Click "Save"

### 3. Configure Domain-Wide Delegation in Google Workspace Admin Console

1. Go to the [Google Workspace Admin Console](https://admin.google.com/)
2. Navigate to "Security" > "Access and data control" > "API Controls"
3. In the "Domain-wide Delegation" section, click "Manage Domain-wide Delegation"
4. Click "Add new"
5. Enter the Client ID (the numeric part of the service account email address)
6. For the OAuth scopes, enter: `https://mail.google.com/`
7. Click "Authorize"

### 4. Set Up Environment Variables

Add the following environment variables to your Firebase Functions:

```bash
# For Cloud Functions v2, deploy with environment variables:
gcloud functions deploy FUNCTION_NAME
  --gen2
  --runtime=nodejs20
  --region=us-central1
  --set-env-vars="GMAIL_SERVICE_ACCOUNT_EMAIL=your-service-account@luknerlumina-firebase.iam.gserviceaccount.com,GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

Replace:
- `FUNCTION_NAME` with the name of your function
- `your-service-account@luknerlumina-firebase.iam.gserviceaccount.com` with your actual service account email
- `YOUR_PRIVATE_KEY_HERE` with the private key from the JSON key file (replace newlines with `\n`)

### 5. Store Credentials in Secret Manager (Recommended)

For better security, store the service account credentials in Google Secret Manager:

```bash
# Create secrets
echo -n "your-service-account@luknerlumina-firebase.iam.gserviceaccount.com" |
  gcloud secrets create GMAIL_SERVICE_ACCOUNT_EMAIL
  --project=luknerlumina-firebase
  --replication-policy="automatic"
  --data-file=-

echo -n "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n" |
  gcloud secrets create GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY
  --project=luknerlumina-firebase
  --replication-policy="automatic"
  --data-file=-

# Grant access to the service accoun
gcloud secrets add-iam-policy-binding GMAIL_SERVICE_ACCOUNT_EMAIL
  --project=luknerlumina-firebase
  --member="serviceAccount:tebra-cloud-run-sa@luknerlumina-firebase.iam.gserviceaccount.com"
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY
  --project=luknerlumina-firebase
  --member="serviceAccount:tebra-cloud-run-sa@luknerlumina-firebase.iam.gserviceaccount.com"
  --role="roles/secretmanager.secretAccessor"
```

Then update the pull-secrets.js script to include these secrets:

```javascrip
// In scripts/pull-secrets.js, add to SECRETS_TO_PULL array
const SECRETS_TO_PULL = [
  // ... existing entries
  { name: 'GMAIL_SERVICE_ACCOUNT_EMAIL', envVar: 'GMAIL_SERVICE_ACCOUNT_EMAIL' },
  { name: 'GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY', envVar: 'GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY' }
];
```

## Usage

The Service Account Email Service is used by the monitoring system to send security alerts. The `sendEmailAlert` method in `monitoring.js` calls the `sendEmail` function from the service account email service.

## Troubleshooting

If you encounter issues with sending emails:

1. Verify that the service account has the necessary permissions
2. Check that domain-wide delegation is properly configured
3. Ensure the service account private key is correctly formatted
4. Check the Firebase Functions logs for error messages

## Benefits of Service Account + Domain-Wide Delegation

- **Security**: No need to store refresh tokens
- **Reliability**: Service account credentials don't expire
- **Maintainability**: Easy to rotate keys without affecting users
- **Compliance**: Meets HIPAA requirements for secure authentication
- **Scalability**: Works well for automated systems and background processes
