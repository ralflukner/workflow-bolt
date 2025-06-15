
# OAuth Client Secret Management Guide

## Problem Identified

Your `.gitignore` contained a specific OAuth client secret file:

```

/config/client_secret_472501334334-hoph63lb8i2o53a68d118n4k4le19kki.apps.googleusercontent.com.json

```

This indicates you're using Google OAuth. Here's how to properly manage these secrets.

## OAuth Secrets vs API Credentials

| Type | Purpose | Storage Method |
|------|---------|----------------|
| OAuth Client Secrets | User authentication (login with Google) | Can be in code with restrictions |
| API Credentials (Tebra) | Server-to-server authentication | Must be in Secret Manager |

## Best Practices for OAuth Client Secrets

### 1. For Web Applications (Client-Side)

OAuth client IDs for web apps are **not secret** and can be in your code:

```javascrip
// This is OK for web apps
const googleClientId = '472501334334-hoph63lb8i2o53a68d118n4k4le19kki.apps.googleusercontent.com';

```

However, the client secret should **never** be in client-side code.

### 2. For Server-Side OAuth

Store OAuth secrets in Google Secret Manager:

```bash

# Store the entire OAuth config in GSM

gcloud secrets create google-oauth-config --data-file=client_secret.json

# Or store individual values

gcloud secrets create google-oauth-client-id --data-file=- <<< "your-client-id"
gcloud secrets create google-oauth-client-secret --data-file=- <<< "your-client-secret"

```

### 3. PHP Implementation for OAuth

```php
<?php
namespace App\Services;

use App\Traits\SecretManagerTrait;

class GoogleOAuthService
{
    use SecretManagerTrait;

    private array $oauthConfig;

    public function __construct()
    {
        $this->initializeSecretManager();
        $this->loadOAuthConfig();
    }

    private function loadOAuthConfig(): void
    {
        // Option 1: Load entire config from GSM
        $configJson = $this->getSecret('google-oauth-config');
        $this->oauthConfig = json_decode($configJson, true);

        // Option 2: Load individual secrets
        $this->oauthConfig = [
            'client_id' => $this->getSecret('google-oauth-client-id'),
            'client_secret' => $this->getSecret('google-oauth-client-secret'),
            'redirect_uri' => getenv('GOOGLE_OAUTH_REDIRECT_URI')
        ];
    }

    public function getAuthUrl(): string
    {
        $params = [
            'client_id' => $this->oauthConfig['client_id'],
            'redirect_uri' => $this->oauthConfig['redirect_uri'],
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'access_type' => 'offline'
        ];

        return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
    }

    public function exchangeCodeForToken(string $code): array
    {
        // This uses the client secret, so must be server-side only
        $params = [
            'code' => $code,
            'client_id' => $this->oauthConfig['client_id'],
            'client_secret' => $this->oauthConfig['client_secret'],
            'redirect_uri' => $this->oauthConfig['redirect_uri'],
            'grant_type' => 'authorization_code'
        ];

        // Make request to token endpoint...
    }
}

```

### 4. Environment-Specific Configuration

```php
// config/oauth.php
return [
    'google' => [
        // Client ID can be in config (it's public)
        'client_id' => env('GOOGLE_OAUTH_CLIENT_ID', '472501334334-hoph63lb8i2o53a68d118n4k4le19kki.apps.googleusercontent.com'),

        // Never put client secret in config files
        'client_secret' => null, // Loaded from GSM at runtime

        // Redirect URIs can be in config
        'redirect_uri' => env('GOOGLE_OAUTH_REDIRECT_URI', 'https://yourapp.com/auth/callback'),
    ]
];

```

### 5. Migration Scrip

```bash
#!/bin/bash

# migrate-oauth-to-gsm.sh

echo "Migrating OAuth credentials to Google Secret Manager..."

# Check if the file exists

if [ ! -f "config/client_secret_*.json" ]; then
    echo "No client secret file found in config/"
    exit 1
fi

# Read the client secret file

CLIENT_SECRET_FILE=$(ls config/client_secret_*.json | head -1)
echo "Found: $CLIENT_SECRET_FILE"

# Extract values

CLIENT_ID=$(jq -r '.web.client_id // .installed.client_id' "$CLIENT_SECRET_FILE")
CLIENT_SECRET=$(jq -r '.web.client_secret // .installed.client_secret' "$CLIENT_SECRET_FILE")

# Store in GSM

echo "Storing in Google Secret Manager..."
echo -n "$CLIENT_ID" | gcloud secrets create google-oauth-client-id --data-file=- 2>/dev/null ||
    echo -n "$CLIENT_ID" | gcloud secrets versions add google-oauth-client-id --data-file=-

echo -n "$CLIENT_SECRET" | gcloud secrets create google-oauth-client-secret --data-file=- 2>/dev/null || \
    echo -n "$CLIENT_SECRET" | gcloud secrets versions add google-oauth-client-secret --data-file=-

# Store the entire file as backup

gcloud secrets create google-oauth-config --data-file="$CLIENT_SECRET_FILE" 2>/dev/null || \
    gcloud secrets versions add google-oauth-config --data-file="$CLIENT_SECRET_FILE"

echo "✅ OAuth credentials migrated to GSM"

# Remove the file

read -p "Remove the original file? (yes/no): " confirm
if [ "$confirm" = "yes" ]; then
    rm "$CLIENT_SECRET_FILE"
    echo "✅ Original file removed"
fi

echo ""
echo "Next steps:"
echo "1. Update your code to load OAuth secrets from GSM"
echo "2. Commit the removal of the client secret file"
echo "3. Clean Git history if the file was previously committed"

```

### 6. For Different OAuth Flows

#### Implicit Flow (SPA)

```javascrip
// Client ID only - no secret needed
const googleAuth = {
    clientId: '472501334334-hoph63lb8i2o53a68d118n4k4le19kki.apps.googleusercontent.com',
    scope: 'openid email profile'
};

```

#### Authorization Code Flow (Server-Side)

```php
// Client secret required - must be in GSM
$oauth = new GoogleOAuthService(); // Loads from GSM

```

#### Service Account Flow

```php
// Different from OAuth - uses service account key
$serviceAccountKey = $this->getSecret('google-service-account-key');

```

## Security Checklist for OAuth

- [ ] Client secrets removed from all code files

- [ ] Client secrets stored in GSM

- [ ] OAuth config files removed from repository

- [ ] Git history cleaned if secrets were committed

- [ ] Different secrets for dev/staging/production

- [ ] Redirect URIs properly configured in Google Console

- [ ] Using HTTPS for all redirect URIs

- [ ] State parameter used to prevent CSRF

- [ ] PKCE implemented for public clients

## Common Mistakes to Avoid

1. **Putting client secret in JavaScript** - Never do this
2. **Committing OAuth JSON files** - Use GSM instead
3. **Using same OAuth app for dev/prod** - Separate them
4. **Not rotating OAuth secrets** - Rotate every 90 days
