#!/opt/homebrew/bin/bash
# scripts/sync-gsm-with-env.sh

set -e

echo "🔄 Synchronizing Google Secret Manager with .env file..."
echo "=================================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Function to create or update a secret in GSM
update_gsm_secret() {
    local secret_name=$1
    local secret_value=$2

    echo -n "📝 Checking ${secret_name}... "

    # Check if secret exists
    if gcloud secrets describe "${secret_name}" &>/dev/null; then
        # Get current value from GSM
        current_value=$(gcloud secrets versions access latest --secret="${secret_name}" 2>/dev/null || echo "")

        if [ "$current_value" == "$secret_value" ]; then
            echo "✅ Already up to date"
        else
            echo "⚠️  Updating..."
            echo -n "$secret_value" | gcloud secrets versions add "${secret_name}" --data-file=-
            if [ $? -eq 0 ]; then
                echo "   ✅ Updated successfully"
            else
                echo "   ❌ Update failed"
            fi
        fi
    else
        echo "🆕 Creating new secret..."
        echo -n "$secret_value" | gcloud secrets create "${secret_name}" --data-file=-
        if [ $? -eq 0 ]; then
            echo "   ✅ Created successfully"
        else
            echo "   ❌ Creation failed"
        fi
    fi
}

# Function to extract value from .env file
get_env_value() {
    local key=$1
    local value=$(grep "^${key}=" .env | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//')
    echo "$value"
}

# Map of .env variables to GSM secret names
declare -A env_to_gsm=(
    ["VITE_TEBRA_USERNAME"]="TEBRA_USERNAME"
    ["VITE_TEBRA_PASSWORD"]="TEBRA_PASSWORD"
    ["VITE_TEBRA_PROXY_API_KEY"]="TEBRA_PROXY_API_KEY"
    ["VITE_PATIENT_ENCRYPTION_KEY"]="PATIENT_ENCRYPTION_KEY"
    ["GMAIL_CLIENT_ID"]="GMAIL_CLIENT_ID"
    ["GMAIL_CLIENT_SECRET"]="GMAIL_CLIENT_SECRET"
    ["GMAIL_SERVICE_ACCOUNT_EMAIL"]="GMAIL_SERVICE_ACCOUNT_EMAIL"
    ["GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY"]="GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY"
    ["GOOGLE_CLOUD_PROJECT"]="GOOGLE_CLOUD_PROJECT"
)

echo ""
echo "🔍 Processing secrets..."
echo "------------------------"

# Process each secret
for env_key in "${!env_to_gsm[@]}"; do
    gsm_key="${env_to_gsm[$env_key]}"
    env_value=$(get_env_value "$env_key")

    if [ -z "$env_value" ]; then
        echo "⚠️  Warning: ${env_key} not found in .env file"
        continue
    fi

    # Special handling for private key - convert \n to actual newlines
    if [[ "$env_key" == "GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY" ]]; then
        env_value=$(echo "$env_value" | sed 's/\\n/\n/g')
    fi

    update_gsm_secret "$gsm_key" "$env_value"
done

# Also check Firebase-related secrets that might be needed
echo ""
echo "🔥 Checking Firebase configuration secrets..."
echo "--------------------------------------------"

# Firebase config values
firebase_secrets=(
    ["VITE_FIREBASE_PROJECT_ID"]="FIREBASE_PROJECT_ID"
    ["VITE_FIREBASE_API_KEY"]="FIREBASE_API_KEY"
    ["VITE_FIREBASE_AUTH_DOMAIN"]="FIREBASE_AUTH_DOMAIN"
    ["VITE_FIREBASE_STORAGE_BUCKET"]="FIREBASE_STORAGE_BUCKET"
    ["VITE_FIREBASE_MESSAGING_SENDER_ID"]="FIREBASE_MESSAGING_SENDER_ID"
    ["VITE_FIREBASE_APP_ID"]="FIREBASE_APP_ID"
)

for env_key in "${!firebase_secrets[@]}"; do
    gsm_key="${firebase_secrets[$env_key]}"
    env_value=$(get_env_value "$env_key")

    if [ -n "$env_value" ]; then
        update_gsm_secret "$gsm_key" "$env_value"
    fi
done

# Verify critical secrets
echo ""
echo "🔐 Verifying critical secrets..."
echo "--------------------------------"

critical_secrets=(
    "TEBRA_USERNAME"
    "TEBRA_PASSWORD"
    "TEBRA_PROXY_API_KEY"
    "PATIENT_ENCRYPTION_KEY"
)

all_good=true
for secret in "${critical_secrets[@]}"; do
    if gcloud secrets describe "$secret" &>/dev/null; then
        value=$(gcloud secrets versions access latest --secret="$secret" 2>/dev/null || echo "")
        if [ -n "$value" ]; then
            echo "✅ ${secret}: Present (${#value} chars)"
        else
            echo "❌ ${secret}: Empty!"
            all_good=false
        fi
    else
        echo "❌ ${secret}: Not found!"
        all_good=false
    fi
done

# Summary
echo ""
echo "📊 Summary"
echo "=========="
if [ "$all_good" = true ]; then
    echo "✅ All critical secrets are properly configured in GSM"
else
    echo "⚠️  Some critical secrets are missing or empty"
fi

echo ""
echo "💡 To test the configuration, run:"
echo "   npm run test:real-api:gsm"
echo ""
echo "🔧 To update Cloud Functions with new secrets:"
echo "   firebase functions:config:set tebra.proxy_api_key=\"$(get_env_value 'VITE_TEBRA_PROXY_API_KEY')\""
echo "   firebase deploy --only functions"
echo ""
echo "☁️  To update Cloud Run with new secrets:"
echo "   ./scripts/update-tebra-cloudrun-env.sh"