# Service Account + Domain-Wide Delegation Implementation for Gmail

## Overview

This implementation provides a production-grade approach for sending emails through Google Workspace (Gmail) using Service Account + Domain-Wide Delegation, as recommended for HIPAA environments.

## What Was Implemented

1. **Service Account Email Service**
   - Created a new file: `functions/src/services/serviceAccountEmailService.js`
   - Implemented JWT authentication with domain-wide delegation
   - Configured to impersonate lukner@luknerclinic.com

2. **Updated Monitoring System**
   - Modified `functions/src/monitoring.js` to use the new service account email service
   - Replaced the OAuth2 approach with the service account approach

3. **Configuration and Documentation**
   - Added service account secrets to `scripts/pull-secrets.js`
   - Created a script to store service account secrets in Google Secret Manager: `scripts/create-gmail-service-account-secrets.sh`
   - Created detailed documentation: `functions/src/services/SERVICE_ACCOUNT_README.md`

## Benefits of This Approach

1. **Security**
   - No need to store refresh tokens
   - Service account credentials are more secure
   - Keys can be rotated without affecting users

2. **Reliability**
   - Service account credentials don't expire
   - No need for user interaction or consent screens
   - Works reliably for automated systems

3. **Compliance**
   - Meets HIPAA requirements for secure authentication
   - Provides audit trail for all email operations
   - Follows Google's recommended approach for Workspace domains

4. **Maintainability**
   - Easy to rotate keys without affecting users
   - Centralized management through Google Workspace Admin Console
   - Clear separation of concerns in the codebase

## How to Use This Implementation

### 1. Set Up the Service Account

Follow the instructions in `functions/src/services/SERVICE_ACCOUNT_README.md` to:
1. Create a service account in the Google Cloud Console
2. Enable domain-wide delegation for the service account
3. Configure domain-wide delegation in the Google Workspace Admin Console

### 2. Store Service Account Credentials

Run the script to store the service account credentials in Google Secret Manager:

```bash
chmod +x scripts/create-gmail-service-account-secrets.sh
./scripts/create-gmail-service-account-secrets.sh
```

The script will prompt you for:
- The service account email address
- The path to the service account private key JSON file

### 3. Deploy Functions with Service Account Credentials

Deploy your functions with the service account credentials:

```bash
gcloud functions deploy FUNCTION_NAME \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --set-env-vars="GMAIL_SERVICE_ACCOUNT_EMAIL=$(gcloud secrets versions access latest --secret=GMAIL_SERVICE_ACCOUNT_EMAIL),GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY=$(gcloud secrets versions access latest --secret=GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY)"
```

Replace `FUNCTION_NAME` with the name of your function.

### 4. Test the Implementation

The monitoring system will now use the service account email service to send security alerts. You can test it by:

1. Triggering a security alert (e.g., by simulating excessive authentication failures)
2. Checking the logs to verify that the email was sent successfully
3. Confirming that the email was received at lukner@luknerclinic.com

## Comparison with Previous Approach

| Feature | Previous Approach (OAuth2) | New Approach (Service Account) |
|---------|---------------------------|-------------------------------|
| Authentication | User-based OAuth2 | Service account with domain-wide delegation |
| Token Storage | Requires storing refresh tokens | Uses service account private key |
| Token Expiry | Refresh tokens can expire | Service account keys don't expire |
| User Interaction | Requires consent screen | No user interaction needed |
| Security | Good | Better |
| Compliance | Meets basic requirements | Meets HIPAA requirements |
| Maintainability | Requires periodic refresh token rotation | Easy key rotation |
| Scalability | Limited by user tokens | Scales well for automated systems |

## Conclusion

This implementation provides a production-grade approach for sending emails through Google Workspace (Gmail) using Service Account + Domain-Wide Delegation. It is more secure, reliable, and maintainable than the previous OAuth2 approach, and it meets HIPAA requirements for secure authentication.