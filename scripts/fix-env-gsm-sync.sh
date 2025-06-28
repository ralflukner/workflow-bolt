#!/opt/homebrew/bin/bash
# scripts/fix-env-gsm-sync.sh

set -e

echo "🔧 Fixing .env file to match Google Secret Manager..."
echo "===================================================="

# Backup current .env
cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"

# Function to add or update env variable
update_env_var() {
    local key="$1"
    local value="$2"

    if grep -q "^${key}=" .env; then
        # Update existing
        sed -i.tmp "s|^${key}=.*|${key}=${value}|" .env
    else
        # Add new
        echo "${key}=${value}" >> .env
    fi
}

# Function to get secret from GSM
get_gsm_secret() {
    local secret_name="$1"
    gcloud secrets versions access latest --secret="${secret_name}" 2>/dev/null || echo ""
}

echo "📥 Pulling missing/different values from GSM..."

# 1. Add missing Gmail OAuth variables
GMAIL_REFRESH_TOKEN=$(get_gsm_secret "GMAIL_REFRESH_TOKEN")
if [ -n "$GMAIL_REFRESH_TOKEN" ]; then
    echo "✅ Adding GMAIL_REFRESH_TOKEN"
    update_env_var "GMAIL_REFRESH_TOKEN" "$GMAIL_REFRESH_TOKEN"
fi

GMAIL_OAUTH_CLIENT_ID=$(get_gsm_secret "GMAIL_OAUTH_CLIENT_ID")
if [ -n "$GMAIL_OAUTH_CLIENT_ID" ]; then
    echo "✅ Adding GMAIL_OAUTH_CLIENT_ID"
    update_env_var "GMAIL_OAUTH_CLIENT_ID" "$GMAIL_OAUTH_CLIENT_ID"
fi

GMAIL_OAUTH_CLIENT_SECRET=$(get_gsm_secret "GMAIL_OAUTH_CLIENT_SECRET")
if [ -n "$GMAIL_OAUTH_CLIENT_SECRET" ]; then
    echo "✅ Adding GMAIL_OAUTH_CLIENT_SECRET"
    update_env_var "GMAIL_OAUTH_CLIENT_SECRET" "$GMAIL_OAUTH_CLIENT_SECRET"
fi

# 2. Fix GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY (get from GSM)
echo "🔄 Updating GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY from GSM..."
PRIVATE_KEY=$(get_gsm_secret "GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY")
if [ -n "$PRIVATE_KEY" ]; then
    # Escape the private key properly for .env file
    ESCAPED_KEY=$(echo "$PRIVATE_KEY" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')
    update_env_var "GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY" "\"$ESCAPED_KEY\""
fi

# 3. Add REACT_APP_PATIENT_ENCRYPTION_KEY (same as VITE version)
PATIENT_KEY=$(get_gsm_secret "PATIENT_ENCRYPTION_KEY")
if [ -n "$PATIENT_KEY" ]; then
    echo "✅ Adding REACT_APP_PATIENT_ENCRYPTION_KEY"
    update_env_var "REACT_APP_PATIENT_ENCRYPTION_KEY" "$PATIENT_KEY"

    # Also update VITE_PATIENT_ENCRYPTION_KEY to match GSM
    echo "🔄 Updating VITE_PATIENT_ENCRYPTION_KEY to match GSM"
    update_env_var "VITE_PATIENT_ENCRYPTION_KEY" "$PATIENT_KEY"
fi

# 4. Update VITE_TEBRA_PROXY_API_KEY from GSM
PROXY_KEY=$(get_gsm_secret "TEBRA_PROXY_API_KEY")
if [ -n "$PROXY_KEY" ]; then
    echo "🔄 Updating VITE_TEBRA_PROXY_API_KEY to match GSM"
    update_env_var "VITE_TEBRA_PROXY_API_KEY" "$PROXY_KEY"
fi

# 5. Create VITE_FIREBASE_CONFIG as JSON string
echo "📝 Creating VITE_FIREBASE_CONFIG from individual values..."

# Source .env to get current Firebase values
set -a
source .env
set +a

FIREBASE_CONFIG=$(cat <<EOF
{"projectId":"${VITE_FIREBASE_PROJECT_ID:-luknerlumina-firebase}","apiKey":"${VITE_FIREBASE_API_KEY:-__REPLACE_WITH_API_KEY__}","authDomain":"${VITE_FIREBASE_AUTH_DOMAIN:-luknerlumina-firebase.firebaseapp.com}","storageBucket":"${VITE_FIREBASE_STORAGE_BUCKET:-luknerlumina-firebase.appspot.com}","messagingSenderId":"${VITE_FIREBASE_MESSAGING_SENDER_ID:-623450773640}","appId":"${VITE_FIREBASE_APP_ID:-1:623450773640:web:9afd63d3ccbb1fcb6fe73d}"}
EOF
)
update_env_var "VITE_FIREBASE_CONFIG" "$FIREBASE_CONFIG"

# Clean up temp files
rm -f .env.tmp

# Get backup filename for display
BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"

echo ""
echo "✅ Fixed .env file!"
echo "📄 Backup saved as: $BACKUP_FILE"
echo ""
echo "🔍 Verifying changes..."
echo "----------------------"

# Show what was added/updated
echo "Added/Updated variables:"
grep -E "(GMAIL_REFRESH_TOKEN|GMAIL_OAUTH_CLIENT_ID|GMAIL_OAUTH_CLIENT_SECRET|REACT_APP_PATIENT_ENCRYPTION_KEY|VITE_FIREBASE_CONFIG)=" .env | head -5

echo ""
echo "💡 Next steps:"
echo "1. Review the changes in .env"
echo "2. Update .envrc to match: source .env"
echo "3. Run tests: npm run test:real-api:gsm"