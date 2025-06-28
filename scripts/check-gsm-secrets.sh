#!/opt/homebrew/bin/bash
# scripts/check-gsm-secrets.sh

echo "🔍 Checking which secrets exist in Google Secret Manager..."
echo "========================================================="

# List of expected secrets
declare -a expected_secrets=(
    "VITE_AUTH0_REDIRECT_URI"
    "VITE_AUTH0_AUDIENCE"
    "VITE_AUTH0_SCOPE"
    "VITE_TEBRA_WSDL_URL"
    "GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY"
    "PATIENT_ENCRYPTION_KEY"
    "TEBRA_PROXY_API_KEY"
    "VITE_FIREBASE_CONFIG"
)

# Check each secret
echo "📋 Expected secrets status:"
echo "---------------------------"
for secret in "${expected_secrets[@]}"; do
    if gcloud secrets versions access latest --secret="$secret" &>/dev/null; then
        echo "✅ $secret - EXISTS"
    else
        echo "❌ $secret - MISSING"
    fi
done

echo ""
echo "📜 All secrets in GSM:"
echo "---------------------"
gcloud secrets list --format="table(name)" | grep -v "NAME" | sort

echo ""
echo "💡 To create missing secrets from .env values:"
echo "   ./scripts/push-env-to-gsm.sh"