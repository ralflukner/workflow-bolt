#!/bin/bash
# scripts/sync-env-from-gsm.sh

set -e

echo "🔄 Syncing .env file with Google Secret Manager values..."
echo "========================================================"

# Backup current .env
BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
cp .env "$BACKUP_FILE"
echo "📄 Backup saved as: $BACKUP_FILE"

# Function to update or add env variable
update_env_var() {
    local key="$1"
    local value="$2"

    # Escape special characters for sed using bash parameter expansion
    local escaped_value="${value//\\/\\\\}"  # Escape backslashes first
    escaped_value="${escaped_value//\//\\/}"  # Escape forward slashes
    escaped_value="${escaped_value//&/\\&}"   # Escape ampersands
    escaped_value="${escaped_value//\$/\\\$}" # Escape dollar signs

    if grep -q "^${key}=" .env; then
        # Update existing - use | as delimiter to avoid conflicts with URLs
        sed -i.tmp "s|^${key}=.*|${key}=${escaped_value}|" .env
        echo "   🔄 Updated: ${key}"
    else
        # Add new
        echo "${key}=${value}" >> .env
        echo "   ➕ Added: ${key}"
    fi
}

# Function to get secret from GSM
get_gsm_secret() {
    local secret_name="$1"
    gcloud secrets versions access latest --secret="${secret_name}" 2>/dev/null || echo ""
}

echo ""
echo "📥 Syncing mismatched values from GSM..."
echo "----------------------------------------"

# 1. Fix AUTH0 values
echo "🔐 Updating Auth0 configuration..."
AUTH0_REDIRECT=$(get_gsm_secret "VITE_AUTH0_REDIRECT_URI")
if [ -n "$AUTH0_REDIRECT" ]; then
    update_env_var "VITE_AUTH0_REDIRECT_URI" "$AUTH0_REDIRECT"
fi

AUTH0_AUDIENCE=$(get_gsm_secret "VITE_AUTH0_AUDIENCE")
if [ -n "$AUTH0_AUDIENCE" ]; then
    update_env_var "VITE_AUTH0_AUDIENCE" "$AUTH0_AUDIENCE"
fi

AUTH0_SCOPE=$(get_gsm_secret "VITE_AUTH0_SCOPE")
if [ -n "$AUTH0_SCOPE" ]; then
    # Auth0 scope might have spaces, so quote it
    update_env_var "VITE_AUTH0_SCOPE" "\"$AUTH0_SCOPE\""
fi

# 2. Fix TEBRA WSDL URL
echo ""
echo "🏥 Updating Tebra configuration..."
TEBRA_WSDL=$(get_gsm_secret "VITE_TEBRA_WSDL_URL")
if [ -n "$TEBRA_WSDL" ]; then
    update_env_var "VITE_TEBRA_WSDL_URL" "$TEBRA_WSDL"
fi

# 3. Fix Gmail Service Account Private Key
echo ""
echo "📧 Updating Gmail configuration..."
PRIVATE_KEY=$(get_gsm_secret "GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY")
if [ -n "$PRIVATE_KEY" ]; then
    # Escape the private key properly for .env file using parameter expansion
    ESCAPED_KEY="${PRIVATE_KEY//\\/\\\\}"     # Escape backslashes
    ESCAPED_KEY="${ESCAPED_KEY//\"/\\\"}"     # Escape quotes
    ESCAPED_KEY="${ESCAPED_KEY//$'\n'/\\n}"   # Convert newlines to \n
    update_env_var "GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY" "\"$ESCAPED_KEY\""
fi

# 4. Add missing GMAIL_REFRESH_TOKEN
REFRESH_TOKEN=$(get_gsm_secret "GMAIL_REFRESH_TOKEN")
if [ -n "$REFRESH_TOKEN" ]; then
    update_env_var "GMAIL_REFRESH_TOKEN" "$REFRESH_TOKEN"
fi

# 5. Fix Patient Encryption Keys
echo ""
echo "🔒 Updating encryption keys..."
PATIENT_KEY=$(get_gsm_secret "PATIENT_ENCRYPTION_KEY")
if [ -n "$PATIENT_KEY" ]; then
    update_env_var "REACT_APP_PATIENT_ENCRYPTION_KEY" "$PATIENT_KEY"
    update_env_var "VITE_PATIENT_ENCRYPTION_KEY" "$PATIENT_KEY"
fi

# 6. Fix Tebra Proxy API Key
echo ""
echo "🔑 Updating API keys..."
PROXY_KEY=$(get_gsm_secret "TEBRA_PROXY_API_KEY")
if [ -n "$PROXY_KEY" ]; then
    update_env_var "VITE_TEBRA_PROXY_API_KEY" "$PROXY_KEY"
fi

# 7. Add VITE_FIREBASE_CONFIG
echo ""
echo "🔥 Adding Firebase config..."
FIREBASE_CONFIG=$(get_gsm_secret "VITE_FIREBASE_CONFIG")
if [ -n "$FIREBASE_CONFIG" ]; then
    update_env_var "VITE_FIREBASE_CONFIG" "$FIREBASE_CONFIG"
fi

# Clean up temp files
rm -f .env.tmp

echo ""
echo "✅ Sync complete!"
echo ""
echo "📋 Summary of changes:"
echo "---------------------"
echo "• Updated Auth0 redirect URI, audience, and scope"
echo "• Updated Tebra WSDL URL"
echo "• Updated Gmail service account private key"
echo "• Added Gmail refresh token"
echo "• Updated patient encryption keys (both REACT_APP and VITE versions)"
echo "• Updated Tebra proxy API key"
echo "• Added Firebase config JSON"

echo ""
echo "🔍 Running verification..."
./scripts/verify-env-gsm-consistency.sh | grep -E "(Summary:|Environment and GSM)"

echo ""
echo "💡 Next steps:"
echo "1. Review the changes: diff .env $BACKUP_FILE"
echo "2. Update .envrc to match: ./scripts/sync-envrc-from-env.sh"
echo "3. Reload environment: source .env"
echo "4. Run tests: npm run test:real-api:gsm"