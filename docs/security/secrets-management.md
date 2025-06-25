# Secrets Management Guide

## Overview

This document provides guidance on managing secrets for the Workflow Bolt application, ensuring they are securely stored in Google Secret Manager (GSM) for HIPAA compliance.

## Required Secrets

The following secrets must be stored in Google Secret Manager:

1. **TEBRA_PROXY_API_KEY** - API key for the Tebra Proxy service
2. **FIREBASE_CONFIG** - Complete Firebase configuration as a JSON string
3. **GOOGLE_CLOUD_PROJECT** - Google Cloud Project ID

## Setup Scripts

Two scripts have been provided to help set up these secrets in Google Secret Manager:

### 1. Generate Firebase Config

The `scripts/generate-firebase-config.sh` script generates a JSON string for FIREBASE_CONFIG from individual environment variables in `.env.local`.

```bash
# Make the script executable if needed
chmod +x scripts/generate-firebase-config.sh

# Run the script
./scripts/generate-firebase-config.sh

# Export the generated config
export FIREBASE_CONFIG='...' # Use the output from the script
```

### 2. Setup Required Secrets

The `scripts/setup-required-secrets.sh` script sets up all required secrets in Google Secret Manager.

```bash
# Make the script executable if needed
chmod +x scripts/setup-required-secrets.sh

# Set the Google Cloud Project ID
export GOOGLE_CLOUD_PROJECT="your-project-id"

# Run the script
./scripts/setup-required-secrets.sh
```

## Verification

You can verify that the secrets are properly stored in Google Secret Manager by running the `security-check-gsm.sh` script:

```bash
# Make the script executable if needed
chmod +x security-check-gsm.sh

# Set the Google Cloud Project ID
export GOOGLE_CLOUD_PROJECT="your-project-id"

# Run the script
./security-check-gsm.sh
```

## Implementation Details

The application uses the `SecretsService` class to manage secrets with the following priority order:

1. Google Secret Manager (GSM) first
2. Environment variables as fallback
3. Firebase Functions as another option for browser environments

The `SECRET_CONFIGS` object in `src/services/secretsService.ts` defines the mapping between application secret keys and their GSM/environment variable names.

## Best Practices

1. **Never store secrets in code or commit them to version control**
2. **Use Google Secret Manager for all sensitive information**
3. **Rotate secrets regularly**
4. **Limit access to secrets using IAM permissions**
5. **Monitor access to secrets**

## Troubleshooting

If you encounter issues with secrets management:

1. Ensure you have the necessary permissions to access Google Secret Manager
2. Verify that the Google Cloud Project ID is correctly set
3. Check that the secrets are properly stored in Google Secret Manager
4. Verify that the application is configured to use Google Secret Manager
