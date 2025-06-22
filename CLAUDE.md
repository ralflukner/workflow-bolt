# Auth0 Firebase Integration Debugging Guide

**Version**: 1.0  
**Last Updated**: 2025-06-22  
**Authors**: Claude Code Assistant  

## Summary
This document contains debugging information for Auth0 token exchange with Firebase Functions, specifically resolving JWT verification failures.

## Pre-flight Checklist

Before debugging Auth0 authentication issues, verify these prerequisites:

- [ ] Auth0 application is active (not suspended or disabled)
- [ ] Auth0 API is created and linked to the application in Auth0 Dashboard
- [ ] Firebase project billing is enabled (required for external API calls)
- [ ] Firebase Functions have internet access (not blocked by VPC/firewall)
- [ ] Auth0 domain is accessible (can visit `https://{domain}/.well-known/jwks.json`)
- [ ] Client ID exists and matches the Auth0 application
- [ ] Required scopes are granted to the Auth0 application
- [ ] Firebase project has the correct permissions for Secret Manager

## Root Cause Analysis

### Problem
JWT verification was failing with 401 errors during Auth0 token exchange with Firebase custom tokens.

### Root Cause
**Configuration mismatches** between frontend and backend Auth0 settings:

1. **Domain Mismatch**: Frontend and Firebase Functions were using different Auth0 domains
2. **Audience Mismatch**: Frontend and Firebase Functions were using different API audiences
3. **Secret Manager vs Local Config**: Firebase Functions read from Google Secret Manager while frontend used `.env` files

## Architecture Overview

### Auth Flow
```
Frontend (React) 
  ↓ Auth0 Login
Auth0 Domain (dev-uex7qzqmd8c4qnde.us.auth0.com)
  ↓ Returns JWT with audience
Frontend sends JWT to Firebase Function
  ↓ Token Exchange
Firebase Function (exchangeAuth0Token)
  ↓ Verifies JWT using JWKS
  ↓ Creates Firebase Custom Token
Returns Firebase Token to Frontend
```

### Configuration Sources
- **Frontend**: `.env` file with `VITE_*` variables
- **Backend**: Google Secret Manager secrets (`AUTH0_DOMAIN`, `AUTH0_AUDIENCE`)

## Environment Configuration

| Environment | Auth0 Domain | Audience | Redirect URI | Client ID |
|-------------|--------------|----------|--------------|-----------|
| Development | dev-uex7qzqmd8c4qnde.us.auth0.com | https://api.patientflow.com | http://localhost:5173 | I8ZHr1uCjPkO4ePgY6S421N9HQ0nnN7A |
| Staging     | *Not configured* | *Not configured* | *Not configured* | *Not configured* |
| Production  | *Not configured* | *Not configured* | *Not configured* | *Not configured* |

## Working Configuration

### Frontend (.env)
```bash
VITE_AUTH0_DOMAIN=dev-uex7qzqmd8c4qnde.us.auth0.com
VITE_AUTH0_CLIENT_ID=I8ZHr1uCjPkO4ePgY6S421N9HQ0nnN7A
VITE_AUTH0_REDIRECT_URI=http://localhost:5173
VITE_AUTH0_AUDIENCE=https://api.patientflow.com
VITE_AUTH0_SCOPE="openid profile email offline_access"
```

### Backend (Google Secret Manager)
```bash
AUTH0_DOMAIN=dev-uex7qzqmd8c4qnde.us.auth0.com
AUTH0_AUDIENCE=https://api.patientflow.com
```

## Key Files and Locations

### Frontend Configuration
- **Main config**: `/.env`
- **Auth0 setup**: `/src/auth/auth0-config.ts`
- **Auth provider**: `/src/auth/AuthProvider.tsx`
- **Token exchange**: `/src/services/authBridge.ts`

### Backend Configuration
- **Firebase function**: `/functions/index.js`
- **JWT verification**: Lines 92-154 in `/functions/index.js`
- **Token exchange endpoint**: Lines 249-301 in `/functions/index.js`

## Debugging Commands

### Check Secret Manager Values
```bash
gcloud secrets versions access latest --secret="AUTH0_DOMAIN" --project="luknerlumina-firebase"
gcloud secrets versions access latest --secret="AUTH0_AUDIENCE" --project="luknerlumina-firebase"
gcloud secrets list --project="luknerlumina-firebase" --filter="name:AUTH0"
```

### Update Secret Manager
```bash
echo "dev-uex7qzqmd8c4qnde.us.auth0.com" | gcloud secrets versions add AUTH0_DOMAIN --data-file=- --project="luknerlumina-firebase"
echo "https://api.patientflow.com" | gcloud secrets versions add AUTH0_AUDIENCE --data-file=- --project="luknerlumina-firebase"
```

### Deploy Functions
```bash
firebase deploy --only functions:exchangeAuth0Token
```

## Manual JWT Verification

### Token Verification Tool
1. Copy the Auth0 token from browser DevTools (Network tab → exchangeAuth0Token request)
2. Visit https://jwt.io
3. Paste token and verify:
   - `aud` (audience) matches your configured audience: `https://api.patientflow.com`
   - `iss` (issuer) matches: `https://dev-uex7qzqmd8c4qnde.us.auth0.com/`
   - `exp` (expiry) is in the future (Unix timestamp)
   - `sub` (subject) exists and is not empty
   - `alg` (algorithm) is `RS256` or `HS256`

### Browser Console Debugging
```javascript
// Available in development mode only
await getToken(); // Gets current Auth0 token
await loginPopup(); // Forces fresh login

// Check AuthBridge status
const authBridge = AuthBridge.getInstance();
console.log(authBridge.getDebugInfo());
console.log(await authBridge.healthCheck());
```

## Debug Logging

### Frontend (authBridge.ts)
Enhanced logging shows:
- Token acquisition process
- JWT token details (algorithm, audience, issuer, expiry)
- Token exchange attempts and failures
- Cache hit/miss tracking
- Performance timing metrics

### Backend (Firebase Function)
Enhanced logging shows:
- JWT header and payload details
- Expected vs actual audience values
- Detailed error messages with stack traces
- HIPAA-compliant audit logging

## Common Issues and Solutions

### Issue 1: Domain Mismatch
**Symptoms**: `Unknown host` errors, JWT verification failures
**Solution**: Ensure both frontend and backend use the same valid Auth0 domain

### Issue 2: Audience Mismatch  
**Symptoms**: JWT verification fails with audience errors
**Solution**: Verify audience is configured in Auth0 dashboard and matches both frontend/backend

### Issue 3: Invalid Auth0 Domain
**Symptoms**: `Unknown host: luknerclinic.us.auth0.com`
**Solution**: Use valid Auth0 domain from Auth0 dashboard (e.g., `dev-uex7qzqmd8c4qnde.us.auth0.com`)

### Issue 4: Secret Manager Out of Sync
**Symptoms**: Configuration looks correct but still fails
**Solution**: Check and update Google Secret Manager values, then redeploy functions

### Issue 5: Newline Characters in Secret Manager ⭐ **CRITICAL**
**Symptoms**: JWT verification fails with line break in error message like:
```
JWT verification failed: jwt audience invalid. expected: https://api.patientflow.com
 or https://dev-uex7qzqmd8c4qnde.us.auth0.com
/userinfo
```
**Root Cause**: Secret Manager values contain trailing newline characters (`\n`)
**Detection**: Use `gcloud secrets versions access latest --secret="AUTH0_DOMAIN" | xxd` to see hex dump
**Solution**: 
```bash
# Fix with echo -n (no trailing newline)
echo -n "dev-uex7qzqmd8c4qnde.us.auth0.com" | gcloud secrets versions add AUTH0_DOMAIN --data-file=-
echo -n "https://api.patientflow.com" | gcloud secrets versions add AUTH0_AUDIENCE --data-file=-
firebase deploy --only functions:exchangeAuth0Token
```

## Quick Troubleshooting Flow

```
Is login failing?
├─ Yes → Check Auth0 domain exists (visit https://{domain}/.well-known/jwks.json)
│   ├─ 404/DNS error → Fix domain in .env
│   └─ Works → Check client ID in Auth0 dashboard
└─ No → Is token exchange failing?
    ├─ Yes → Check Secret Manager values
    │   ├─ Mismatch → Update & redeploy
    │   └─ Match → Check JWT at jwt.io
    └─ No → Check Firebase auth state
        ├─ No user → Check custom token creation
        └─ Has user → Check application permissions
```

## Testing Process

1. **Clear browser cache** or use incognito mode
2. **Restart dev server** to pick up new environment variables
3. **Check console logs** for detailed JWT debugging information
4. **Verify Secret Manager** values match frontend configuration
5. **Redeploy Firebase Functions** after Secret Manager updates

## Enhanced Debug Features Added

### Frontend Debugging
- JWT token parsing and validation
- Detailed token acquisition logging
- Cache hit/miss tracking
- Performance timing metrics

### Backend Debugging
- JWT header and payload inspection
- Expected vs actual audience comparison
- Detailed error reporting with context
- HIPAA-compliant audit logging

## Commands for Quick Recovery

If authentication breaks again:

1. **Check current config**:
   ```bash
   cat .env | grep AUTH0
   gcloud secrets versions access latest --secret="AUTH0_DOMAIN"
   gcloud secrets versions access latest --secret="AUTH0_AUDIENCE"
   ```

2. **Fix mismatches**:
   ```bash
   # Update Secret Manager to match .env
   echo "$(grep VITE_AUTH0_DOMAIN .env | cut -d'=' -f2)" | gcloud secrets versions add AUTH0_DOMAIN --data-file=-
   echo "$(grep VITE_AUTH0_AUDIENCE .env | cut -d'=' -f2)" | gcloud secrets versions add AUTH0_AUDIENCE --data-file=-
   ```

3. **Deploy**:
   ```bash
   firebase deploy --only functions:exchangeAuth0Token
   ```

## Emergency Rollback Procedure

If authentication completely breaks and needs immediate rollback:

### 1. Rollback to Previous Secret Manager Versions
```bash
# List previous versions
gcloud secrets versions list AUTH0_DOMAIN --project="luknerlumina-firebase"
gcloud secrets versions list AUTH0_AUDIENCE --project="luknerlumina-firebase"

# Get previous working version (replace '2' with actual version number)
gcloud secrets versions access 2 --secret="AUTH0_DOMAIN" --project="luknerlumina-firebase"
gcloud secrets versions access 2 --secret="AUTH0_AUDIENCE" --project="luknerlumina-firebase"

# Set as latest if they were working
echo "dev-uex7qzqmd8c4qnde.us.auth0.com" | gcloud secrets versions add AUTH0_DOMAIN --data-file=-
echo "https://api.patientflow.com" | gcloud secrets versions add AUTH0_AUDIENCE --data-file=-
```

### 2. Rollback Firebase Functions
```bash
# Delete current function
firebase functions:delete exchangeAuth0Token

# Revert to previous code version
git checkout HEAD~1 functions/index.js

# Redeploy
firebase deploy --only functions:exchangeAuth0Token
```

### 3. Rollback Frontend Configuration
```bash
# Revert .env to last working state
git checkout HEAD~1 .env

# Or manually set known working values
echo "VITE_AUTH0_DOMAIN=dev-uex7qzqmd8c4qnde.us.auth0.com" >> .env
echo "VITE_AUTH0_AUDIENCE=https://api.patientflow.com" >> .env
```

## Security Best Practices

### ⚠️ Critical Security Considerations
- **Never commit `.env` files to version control** - Use `.env.example` instead
- **Rotate Auth0 client secrets regularly** (every 90 days minimum)
- **Use least-privilege IAM roles** for Secret Manager access
- **Enable Auth0 anomaly detection** in Auth0 Dashboard → Security
- **Implement rate limiting** on token exchange endpoint (already implemented ✓)
- **Monitor for credential stuffing attacks** in Auth0 logs
- **Use HTTPS only** for all redirect URIs in production

### Secret Management
```bash
# Grant minimal Secret Manager permissions
gcloud projects add-iam-policy-binding luknerlumina-firebase \
    --member="serviceAccount:your-function-sa@luknerlumina-firebase.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Audit secret access
gcloud logging read 'resource.type="secret_manager_secret"' --project="luknerlumina-firebase"
```

## Monitoring and Alerts

### Firebase Functions Monitoring
```bash
# Set up error reporting alerts
gcloud alpha monitoring policies create \
    --notification-channels=$NOTIFICATION_CHANNEL \
    --display-name="Auth0 Token Exchange Failures" \
    --condition-filter='resource.type="cloud_function" AND resource.labels.function_name="exchangeAuth0Token"' \
    --condition-threshold-value=5 \
    --condition-threshold-duration=300s
```

### Key Metrics to Monitor
- **JWT verification failure rate** - Should be < 5%
- **Token exchange latency** - Should be < 2s (P95)
- **Secret Manager access failures** - Should be 0
- **Auth0 login success rate** - Should be > 95%
- **Firebase custom token creation failures** - Should be < 1%

### Auth0 Log Streaming
Configure Auth0 to stream logs to your logging service:
1. Go to Auth0 Dashboard → Monitoring → Logs → Streams
2. Set up stream to Google Cloud Logging or your preferred service
3. Monitor for failed login attempts and anomalies

## Performance Optimization

### Current Optimizations ✓
- **JWKS key caching** - 10 minutes cache with 5 entry limit
- **Token caching** - 55 minute cache to avoid re-exchange
- **Rate limiting** - 100 requests per 15 minutes per IP
- **Connection pooling** - Firebase Admin SDK handles this

### Additional Performance Tips
```bash
# Set minimum instances to avoid cold starts (costs money)
gcloud functions deploy exchangeAuth0Token \
    --min-instances=1 \
    --max-instances=10

# Use regional deployment closer to users
firebase deploy --only functions:exchangeAuth0Token --region=us-central1

# Monitor quota usage
gcloud monitoring metrics list --filter="metric.type:secretmanager.googleapis.com"
```

### Performance Benchmarks
- **Cold start**: ~2-3 seconds
- **Warm start**: ~200-500ms
- **JWKS resolution**: ~100-300ms (cached)
- **Secret Manager access**: ~50-100ms (per secret)

## Error Code Reference

| Error Code | Description | Common Causes | Solution |
|------------|-------------|---------------|----------|
| `invalid-argument` | Missing auth0Token | Frontend not sending token | Check authBridge.ts token acquisition |
| `unauthenticated` | JWT verification failed | Domain/audience mismatch, expired token | Check configuration, verify at jwt.io |
| `internal` | Custom token creation failed | Firebase Admin SDK issues | Check Firebase project permissions |
| `401` | HTTP Unauthorized | Invalid credentials | Verify Auth0 client configuration |
| `429` | Rate limited | Too many requests | Implement exponential backoff |
| `500` | Internal server error | Secret Manager access, JWKS fetch failed | Check IAM permissions, network access |

## Frequently Asked Questions

### Q: Why do I need both frontend and backend Auth0 configuration?
**A**: Frontend gets tokens from Auth0, backend verifies them. Both must use the same domain/audience or verification fails.

### Q: Can I use environment variables instead of Secret Manager?
**A**: Not recommended for production. Secret Manager provides better security, versioning, and access control.

### Q: What happens if JWKS endpoint is down?
**A**: Firebase function will fail JWT verification. The JWKS client has caching and retry logic to minimize impact.

### Q: How often should I rotate Auth0 secrets?
**A**: Client secrets should be rotated every 90 days. Domain and audience rarely change.

### Q: Can I test authentication without deploying functions?
**A**: Yes, use Firebase Functions emulator: `firebase emulators:start --only functions`

### Q: Why is my token exchange slow?
**A**: Check for cold starts, network latency to Auth0, or Secret Manager access issues. Monitor function logs.

## Automation Scripts

### Health Check Script
Create `scripts/auth-health-check.sh`:
```bash
#!/bin/bash
set -e

echo "🔍 Auth0 Configuration Health Check"
echo "=================================="

# Check .env file
echo "📂 Frontend Configuration:"
if [ -f .env ]; then
    grep "VITE_AUTH0" .env || echo "❌ No Auth0 config in .env"
else
    echo "❌ .env file not found"
fi

# Check Secret Manager
echo -e "\n🔐 Backend Configuration:"
DOMAIN=$(gcloud secrets versions access latest --secret="AUTH0_DOMAIN" --project="luknerlumina-firebase" 2>/dev/null || echo "❌ Failed to get AUTH0_DOMAIN")
AUDIENCE=$(gcloud secrets versions access latest --secret="AUTH0_AUDIENCE" --project="luknerlumina-firebase" 2>/dev/null || echo "❌ Failed to get AUTH0_AUDIENCE")

echo "Domain: $DOMAIN"
echo "Audience: $AUDIENCE"

# Check if domain is accessible
echo -e "\n🌐 Domain Accessibility:"
if curl -s "https://$DOMAIN/.well-known/jwks.json" > /dev/null; then
    echo "✅ Auth0 domain is accessible"
else
    echo "❌ Auth0 domain is not accessible"
fi

# Check Firebase function status
echo -e "\n🔥 Firebase Function Status:"
firebase functions:list --filter="exchangeAuth0Token" 2>/dev/null || echo "❌ Failed to list functions"

echo -e "\n✅ Health check complete"
```

### Sync Configuration Script
Create `scripts/sync-auth-config.sh`:
```bash
#!/bin/bash
set -e

echo "🔄 Syncing Auth0 Configuration"
echo "=============================="

# Extract values from .env
DOMAIN=$(grep VITE_AUTH0_DOMAIN .env | cut -d'=' -f2)
AUDIENCE=$(grep VITE_AUTH0_AUDIENCE .env | cut -d'=' -f2)

echo "Syncing from .env to Secret Manager:"
echo "Domain: $DOMAIN"
echo "Audience: $AUDIENCE"

# Update Secret Manager
echo "$DOMAIN" | gcloud secrets versions add AUTH0_DOMAIN --data-file=- --project="luknerlumina-firebase"
echo "$AUDIENCE" | gcloud secrets versions add AUTH0_AUDIENCE --data-file=- --project="luknerlumina-firebase"

echo "✅ Secret Manager updated"

# Deploy functions
echo "🚀 Deploying Firebase Functions..."
firebase deploy --only functions:exchangeAuth0Token

echo "✅ Configuration sync complete"
```

## Change Log

### Version 1.0 (2025-06-22)
- Initial documentation creation
- Added comprehensive debugging procedures
- Documented working configuration
- Added security best practices
- Included monitoring and alerting setup
- Added performance optimization guide
- Created emergency rollback procedures
- Added FAQ section and error code reference

### Future Improvements
- [ ] Add visual architecture diagrams
- [ ] Create automated testing scripts
- [ ] Add staging/production environment configs
- [ ] Include video walkthroughs for common issues
- [ ] Set up automated monitoring dashboards

## Notes
- Auth0 audience parameter is a unique identifier, doesn't need to be a working URL
- Firebase Functions cache Secret Manager values, requiring redeployment after updates
- Enhanced debug logging should be removed or minimized in production for security
- Always verify Auth0 domain exists before updating configuration
- This document should be versioned alongside code changes
- Consider creating executable runbooks for common procedures