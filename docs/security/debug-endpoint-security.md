# Debug Endpoint Security Implementation

## Overview

The debug endpoint in `tebra-php-api/public/index.php` has been completely secured to prevent exposure of sensitive credential information. The previous implementation was disabled with a simple `&& false` condition, which was risky and could be easily bypassed.

## Security Issues Fixed

### 1. **Exposed Sensitive Data**

- **Before**: Exposed username/password lengths and partial values
- **After**: Only shows configuration status (configured/not configured)

### 2. **Weak Access Control**

- **Before**: Disabled with `&& false` (easily bypassed)
- **After**: Multi-factor authentication with API key + admin token

### 3. **No Rate Limiting**

- **Before**: Unlimited access attempts
- **After**: 5 requests per minute per IP address

### 4. **No Audit Trail**

- **Before**: No logging of access attempts
- **After**: Comprehensive audit logging

## Security Implementation

### Multi-Factor Authentication

The debug endpoint now requires **both** credentials:

1. **API Key** (`X-API-Key` header)
2. **Admin Token** (`X-Admin-Token` header)

```php
// Both credentials must be provided and valid
if (!hash_equals($internalApiKey, $clientApiKey) || !hash_equals($adminToken, $clientAdminToken)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized - Invalid credentials']);
    exit;
}
```

### Environment-Based Access Control

Debug mode must be explicitly enabled:

```bash
# Set in Cloud Run environment variables
DEBUG_MODE_ENABLED=true
```

### Rate Limiting

Prevents abuse with IP-based rate limiting:

- **Limit**: 5 requests per minute per IP
- **Storage**: Temporary files in `/tmp`
- **Response**: HTTP 429 (Too Many Requests)

### Audit Logging

All debug access is logged for security monitoring:

```php
error_log("[DEBUG_ACCESS] Admin debug access from IP: $clientIP, Time: " . date(DATE_ATOM));
```

## Setup Instructions

### 1. Create Admin Debug Token

Run the setup script to create the admin token in Google Secret Manager:

```bash
# From the project root
./scripts/create-admin-debug-token.sh your-project-id
```

This script will:

- Generate a cryptographically secure 64-character token
- Store it in Google Secret Manager as `tebra-admin-debug-token`
- Grant access to the Cloud Run service account
- Display usage instructions

### 2. Configure Environment Variables

Set these in your Cloud Run environment:

```bash
DEBUG_MODE_ENABLED=true
```

### 3. Test the Implementation

Use the test script to verify security:

```bash
# Set environment variables
export TEBRA_API_URL="https://your-service-url"
export TEBRA_INTERNAL_API_KEY="your-api-key"
export TEBRA_ADMIN_DEBUG_TOKEN="your-admin-token"

# Run the test
php tebra-php-api/test-debug-endpoint.php
```

## Usage Examples

### Successful Access

```bash
curl -H 'X-API-Key: your-api-key' \
     -H 'X-Admin-Token: your-admin-token' \
     https://your-service-url/debug/secrets
```

**Response:**

```json
{
  "status": "debug_info",
  "timestamp": "2024-01-15T10:30:00Z",
  "environment": {
    "php_version": "8.2.0",
    "server_time": "2024-01-15T10:30:00Z",
    "memory_usage": 1048576,
    "peak_memory": 2097152
  },
  "configuration": {
    "debug_mode_enabled": true,
    "api_key_configured": true,
    "admin_token_configured": true,
    "secrets_manager_available": true
  },
  "secrets_status": {
    "username_configured": true,
    "password_configured": true,
    "customer_key_configured": true,
    "internal_api_key_configured": true
  },
  "security": {
    "rate_limit_remaining": 4,
    "client_ip": "192.168.1.100",
    "request_id": "debug_abc123def456"
  }
}
```

### Failed Access Examples

**No Authentication:**

```bash
curl https://your-service-url/debug/secrets
# Response: HTTP 401 Unauthorized
```

**Only API Key:**

```bash
curl -H 'X-API-Key: your-api-key' https://your-service-url/debug/secrets
# Response: HTTP 401 Unauthorized
```

**Debug Mode Disabled:**

```bash
curl -H 'X-API-Key: your-api-key' -H 'X-Admin-Token: your-admin-token' https://your-service-url/debug/secrets
# Response: HTTP 403 Forbidden
```

**Rate Limited:**

```bash
# After 5 requests in 1 minute
# Response: HTTP 429 Too Many Requests
```

## Security Best Practices

### 1. **Token Management**

- Rotate admin tokens regularly (recommended: every 90 days)
- Store tokens securely (never in code or logs)
- Use different tokens for different environments

### 2. **Access Control**

- Only enable debug mode when needed
- Monitor debug endpoint access logs
- Review access patterns regularly

### 3. **Production Deployment**

- Set `DEBUG_MODE_ENABLED=false` in production
- Consider removing debug endpoint entirely in production
- Use separate admin tokens for different environments

### 4. **Monitoring**

- Set up alerts for debug endpoint access
- Monitor rate limiting violations
- Track failed authentication attempts

## Troubleshooting

### Common Issues

**503 Service Unavailable**

- Admin token not configured in Secret Manager
- Service account lacks Secret Manager access

**401 Unauthorized**

- Missing or incorrect API key
- Missing or incorrect admin token
- Both credentials required

**403 Forbidden**

- Debug mode disabled (`DEBUG_MODE_ENABLED=false`)
- Environment variable not set

**429 Too Many Requests**

- Rate limit exceeded (5 requests/minute)
- Wait 1 minute before retrying

### Debug Mode Configuration

To enable debug mode in Cloud Run:

```bash
gcloud run services update your-service-name \
  --set-env-vars DEBUG_MODE_ENABLED=true \
  --region your-region
```

To disable debug mode:

```bash
gcloud run services update your-service-name \
  --set-env-vars DEBUG_MODE_ENABLED=false \
  --region your-region
```

## Security Compliance

This implementation addresses several security requirements:

- ✅ **Authentication**: Multi-factor authentication required
- ✅ **Authorization**: Explicit permission checks
- ✅ **Data Protection**: No sensitive data exposure
- ✅ **Rate Limiting**: Prevents abuse
- ✅ **Audit Logging**: Complete access trail
- ✅ **Environment Control**: Debug mode toggle
- ✅ **Secure Storage**: Credentials in Secret Manager

## Migration from Old Implementation

If you were using the old debug endpoint:

1. **Remove old access patterns**: The endpoint now requires both credentials
2. **Update scripts**: Add `X-Admin-Token` header to existing calls
3. **Enable debug mode**: Set `DEBUG_MODE_ENABLED=true`
4. **Test thoroughly**: Use the provided test script

The new implementation is backward-incompatible by design to ensure security.
