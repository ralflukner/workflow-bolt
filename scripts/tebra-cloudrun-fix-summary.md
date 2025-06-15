# Tebra Cloud Run Deployment Fix

## Issue Summary

When trying to update the Cloud Run service with a new API key, the deployment fails with an error indicating that several secrets are missing from Secret Manager:

- Secret `projects/623450773640/secrets/tebra-username/versions/latest` was not found
- Secret `projects/623450773640/secrets/tebra-password/versions/latest` was not found
- Secret `projects/623450773640/secrets/tebra-customer-key/versions/latest` was not found

This happens because the Cloud Run service was originally deployed with the `--set-secrets` flag, which configures the service to use secrets from Secret Manager. However, these secrets don't exist in Secret Manager, causing the deployment to fail.

## Solution Files

I've created several scripts to help fix this issue:

1. `create-tebra-secrets.sh`: Creates the missing secrets in Secret Manager
2. `update-tebra-cloudrun-env.sh`: Updates the Cloud Run service to use environment variables instead of secrets
3. `test-tebra-cloudrun.sh`: Tests the Cloud Run service to verify that it's working correctly
4. `tebra-cloudrun-fix-readme.md`: Detailed instructions on how to fix the issue

## Recommended Approach

The recommended approach is to create the missing secrets in Secret Manager (Option 1), as this is more secure than using environment variables directly in the Cloud Run service configuration.

### Steps to Fix the Issue

1. Create the missing secrets in Secret Manager:

```bash
chmod +x scripts/create-tebra-secrets.sh
./scripts/create-tebra-secrets.sh
```

2. Update the Cloud Run service with your new API key:

```bash
gcloud run services update tebra-php-api
     --region us-central1
     --set-env-vars TEBRA_INTERNAL_API_KEY="$NEW_KEY"
```

3. Test the Cloud Run service to verify that it's working correctly:

```bash
export INTERNAL_API_KEY="your-api-key"
chmod +x scripts/test-tebra-cloudrun.sh
./scripts/test-tebra-cloudrun.sh
```

## Alternative Approach

If you prefer not to use Secret Manager, you can update the Cloud Run service to use environment variables instead (Option 2):

```bash
chmod +x scripts/update-tebra-cloudrun-env.sh
./scripts/update-tebra-cloudrun-env.sh
```

## Future Recommendations

To prevent this issue from happening again in the future:

1. Keep the secrets in Secret Manager up to date
2. Use the `--set-secrets` flag consistently in all deployment commands
3. Or, if you prefer environment variables, use the `--set-env-vars` flag consistently and avoid using `--set-secrets`

For more detailed information, please refer to the `tebra-cloudrun-fix-readme.md` file.