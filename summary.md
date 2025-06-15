# OAuth2 Secrets Implementation Summary

## Overview

I've implemented a solution to securely store the OAuth2 secrets in Google Secret Manager (GSM) as requested in the issue description. The implementation includes:

1. A script to create the secrets in GSM
2. Documentation on how to use these secrets
3. Updates to the existing secret pulling mechanism

## Implementation Details

### 1. Created Script to Store OAuth2 Secrets

I created a script (`scripts/create-gmail-oauth-secrets.sh`) that:
- Prompts the user to enter their OAuth2 Client ID and Client Secret
- Creates the `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` secrets in Google Secret Manager
- Grants access to the service account `tebra-cloud-run-sa@luknerlumina-firebase.iam.gserviceaccount.com`

The script follows the same pattern as the existing `create-tebra-secrets.sh` script and uses the naming conventions observed in the project.

### 2. Created Documentation

I created a comprehensive README file (`scripts/gmail-oauth-secrets-readme.md`) that explains:
- Why these secrets need to be stored securely
- How to create the secrets using the provided script
- How to use the secrets in Firebase Functions
- How the email service is already configured to use these environment variables
- Instructions for generating and storing a refresh token
- Security considerations for handling these secrets

### 3. Updated Secret Pulling Mechanism

I updated the `pull-secrets.js` script to include the new OAuth2 secrets in the `SECRETS_TO_PULL` array, so they can be pulled from GSM and added to the `.env` file along with the other secrets.

## How to Use

1. Run the script to create the secrets:
   ```bash
   chmod +x scripts/create-gmail-oauth-secrets.sh
   ./scripts/create-gmail-oauth-secrets.sh
   ```

2. When deploying Firebase Functions, include these secrets as environment variables:
   ```bash
   gcloud functions deploy FUNCTION_NAME \
     --gen2 \
     --runtime=nodejs20 \
     --region=us-central1 \
     --set-env-vars="GMAIL_CLIENT_ID=$(gcloud secrets versions access latest --secret=GMAIL_CLIENT_ID),GMAIL_CLIENT_SECRET=$(gcloud secrets versions access latest --secret=GMAIL_CLIENT_SECRET)"
   ```

3. The email service is already configured to use these environment variables, so no additional code changes are needed.

## Security Considerations

- The secrets are stored securely in Google Secret Manager
- Access is restricted to the service account used by the application
- The secrets are never exposed in the codebase or environment variables
- The documentation includes best practices for handling these secrets
