# Deployment Fix Guide

## Overview

This document describes the deployment fix implemented to resolve Cloud Run environment variable management issues that were preventing successful deployments.

## Problem Description

### Error Encountered

```
ERROR: (gcloud.run.deploy) Cannot update environment variable [TEBRA_USERNAME] to string literal because it has already been set with a different type.
```

### Root Cause
The deployment script was attempting to set environment variables as string literals using the `--set-env-vars` option, but these variables were already configured as secrets in Cloud Run. This created a conflict between the two configuration methods.

## Solution Implementation

### Commit Information

- **Commit**: `11938ab` - fix(deploy): Update deployment script to prevent environment variable updates
- **Date**: June 18, 2025
- **Author**: Ralf B Lukner MD PhD

### Changes Made

#### Before (Problematic)

```bash
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --memory 512Mi \
    --timeout 300 \
    --max-instances 10 \
    --set-env-vars="TEBRA_USERNAME=${TEBRA_USERNAME},TEBRA_PASSWORD=${TEBRA_PASSWORD},TEBRA_CUSTOMER_KEY=${TEBRA_CUSTOMER_KEY},INTERNAL_API_KEY=${INTERNAL_API_KEY}"
```

#### After (Fixed)

```bash
# Note: Environment variables are already configured as secrets in Cloud Run
# Do not attempt to update them as string literals
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --memory 512Mi \
    --timeout 300 \
    --max-instances 10
```

### Key Changes

1. **Removed `--set-env-vars` Option**: Eliminated the conflicting environment variable setting
2. **Added Documentation Comments**: Clear explanation of why environment variables are not set in the deployment command
3. **Maintained Security**: Environment variables continue to be managed as Cloud Run secrets

## Environment Variable Management

### Current Configuration

Environment variables are configured as secrets in Cloud Run:

- `TEBRA_USERNAME`
- `TEBRA_PASSWORD`
- `TEBRA_CUSTOMER_KEY`
- `INTERNAL_API_KEY`

### Benefits of Secret Management

1. **Security**: Credentials are encrypted and not visible in deployment logs
2. **Flexibility**: Can be updated independently of deployments
3. **Compliance**: Meets security requirements for sensitive data
4. **Versioning**: Secrets can be versioned and rotated

## Deployment Process

### Prerequisites

1. Environment variables configured as Cloud Run secrets
2. Proper IAM permissions for Cloud Run deployment
3. Docker image built and available in Container Registry

### Deployment Steps

1. **Build Image**: `gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME`
2. **Deploy Service**: Run the updated deployment script
3. **Verify Deployment**: Check service status and logs
4. **Test Functionality**: Validate API endpoints

### Verification Commands

```bash
# Check deployment status
gcloud run services describe tebra-php-api --region=us-central1

# View recent logs
gcloud run logs read --service tebra-php-api --region=us-central1

# Test health endpoint
curl https://tebra-php-api-xxxxx-uc.a.run.app/health
```

## Best Practices

### 1. Environment Variable Management

- Always use Cloud Run secrets for sensitive data
- Never hardcode credentials in deployment scripts
- Use different secret versions for different environments

### 2. Deployment Scripts

- Include clear documentation about configuration methods
- Add error handling for deployment failures
- Provide verification steps after deployment

### 3. Security Considerations

- Rotate secrets regularly
- Use least-privilege IAM policies
- Monitor secret access and usage

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   # Ensure proper IAM roles
   gcloud projects add-iam-policy-binding $PROJECT_ID \
       --member="user:your-email@domain.com" \
       --role="roles/run.admin"
   ```

2. **Image Not Found**
   ```bash
   # Verify image exists
   gcloud container images list-tags gcr.io/$PROJECT_ID/$SERVICE_NAME
   ```

3. **Service Not Accessible**
   ```bash
   # Check service URL and permissions
   gcloud run services describe $SERVICE_NAME --region=$REGION
   ```

### Debug Commands

```bash
# View deployment history
gcloud run revisions list --service=$SERVICE_NAME --region=$REGION

# Check resource usage
gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(spec.template.spec.containers[0].resources)"

# Monitor logs in real-time
gcloud run logs tail --service=$SERVICE_NAME --region=$REGION
```

## Related Documentation

- [OpenTelemetry Integration Guide](opentelemetry-integration.md)
- [Tebra Cloud Run Design](tebra-cloudrun-design.md)
- [Recent Changes](recent-changes.md)
- [CHANGELOG](CHANGELOG.md)

## Future Improvements

1. **Automated Testing**: Add deployment verification tests
2. **Rollback Capability**: Implement automatic rollback on deployment failure
3. **Blue-Green Deployment**: Support zero-downtime deployments
4. **Monitoring Integration**: Add deployment metrics and alerting 
