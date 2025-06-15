# Fixing Cloud Run Deployment Issues for Tebra PHP API

## Problem

When trying to update the Cloud Run service with a new API key using:

```bash
gcloud run services update tebra-php-api
     --region us-central1
     --set-env-vars TEBRA_INTERNAL_API_KEY="$NEW_KEY"
```

The deployment fails with the error:

```
Deployment failed
ERROR: (gcloud.run.services.update) Revision 'tebra-php-api-00007-gkx' is not ready and cannot serve traffic.
spec.template.spec.containers[0].env[0].value_from.secret_key_ref.name: Secret projects/623450773640/secrets/tebra-username/versions/latest was not found
spec.template.spec.containers[0].env[1].value_from.secret_key_ref.name: Secret projects/623450773640/secrets/tebra-password/versions/latest was not found
spec.template.spec.containers[0].env[3].value_from.secret_key_ref.name: Secret projects/623450773640/secrets/tebra-customer-key/version/latest was not found
```

This error occurs because the Cloud Run service is configured to use secrets from Secret Manager, but these secrets don't exist.

## Solution Options

You have two options to fix this issue:

### Option 1: Create the Missing Secrets in Secret Manager (Recommended)

This is the more secure approach, as it keeps sensitive credentials in Secret Manager.

1. Run the provided script to create the missing secrets:

```bash
chmod +x scripts/create-tebra-secrets.sh
./scripts/create-tebra-secrets.sh
```

2. After creating the secrets, you can update the Cloud Run service with your new API key:

```bash
gcloud run services update tebra-php-api
     --region us-central1
     --set-env-vars TEBRA_INTERNAL_API_KEY="$NEW_KEY"
```

### Option 2: Use Environment Variables Instead of Secrets

This approach is simpler but less secure, as it stores sensitive values directly in the Cloud Run service configuration.

1. Run the provided script to update the Cloud Run service to use environment variables:

```bash
chmod +x scripts/update-tebra-cloudrun-env.sh
./scripts/update-tebra-cloudrun-env.sh
```

2. After updating the service, you can update the API key separately:

```bash
gcloud run services update tebra-php-api
     --region us-central1
     --set-env-vars INTERNAL_API_KEY="$NEW_KEY"
```

## Verifying the Fix

After applying either solution, verify that the Cloud Run service is working correctly:

```bash
# Check the service status
gcloud run services describe tebra-php-api --region us-central1

# Test the service with a simple reques
curl -H "Authorization: Bearer $(gcloud auth print-identity-token)"
     -H "Content-Type: application/json"
     -H "X-API-Key: YOUR_INTERNAL_API_KEY"
     -d '{"action":"health"}'
     https://tebra-php-api-HASH-REGION.a.run.app
```

## Understanding the Root Cause

The issue occurred because the Cloud Run service was configured to use secrets from Secret Manager, but these secrets were not created. The service was deployed with the `--set-secrets` flag, which tells Cloud Run to mount secrets as environment variables.

When you try to update the service with `--set-env-vars`, Cloud Run attempts to create a new revision with both the existing secret mounts and the new environment variables. Since the secrets don't exist, the deployment fails.

## Future Deployments

For future deployments, make sure to:

1. Keep the secrets in Secret Manager up to date
2. Use the `--set-secrets` flag consistently in all deployment commands
3. Or, if you prefer environment variables, use the `--set-env-vars` flag consistently and avoid using `--set-secrets`