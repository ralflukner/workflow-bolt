# Email Service for HIPAA Security Alerts

This service enables sending security alert emails through Google Workspace (Gmail) using OAuth2 authentication.

## Setup Instructions

### 1. Create OAuth2 Credentials in Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your projec
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Add a name (e.g., "HIPAA Security Alerts")
7. Add authorized redirect URIs:
   - `https://developers.google.com/oauthplayground` (for testing)
   - Your application's redirect URI (if applicable)
8. Click "Create"
9. Note the Client ID and Client Secret

### 2. Generate a Refresh Token

1. Go to the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in the top right corner
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. Close the settings
6. Select "Gmail API v1" > `https://mail.google.com/` from the list
7. Click "Authorize APIs"
8. Sign in with the Google Workspace account (`lukner@luknerclinic.com`)
9. Grant the requested permissions
10. Click "Exchange authorization code for tokens"
11. Note the Refresh Token

### 3. Configure Environment Variables

Add the following environment variables to your Firebase Functions:

```bash
firebase functions:config:set gmail.client_id="YOUR_CLIENT_ID" gmail.client_secret="YOUR_CLIENT_SECRET" gmail.refresh_token="YOUR_REFRESH_TOKEN"
```

Or, for Cloud Functions v2, deploy with environment variables:

```bash
gcloud functions deploy FUNCTION_NAME \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
   --set-env-vars="GMAIL_CLIENT_ID=…,GMAIL_CLIENT_SECRET=…,GMAIL_REFRESH_TOKEN=…"
```

### 4. Install Dependencies

The email service requires the following npm packages:

```bash
npm install --save nodemailer googleapis
```

These dependencies have already been added to the package.json file.

## Usage

The email service is used by the monitoring system to send security alerts. The `sendEmailAlert` method in `monitoring.js` calls the `sendEmail` function from the email service.

## Troubleshooting

If you encounter issues with sending emails:

1. Verify that the OAuth2 credentials are correc
2. Check that the refresh token is valid and not expired
3. Ensure the Google Workspace account has the necessary permissions
4. Check the Firebase Functions logs for error messages

For Gmail API quota limits and other restrictions, refer to the [Gmail API documentation](https://developers.google.com/gmail/api/reference/quota).
