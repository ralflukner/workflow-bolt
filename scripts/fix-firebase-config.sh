#!/opt/homebrew/bin/bash
# scripts/fix-firebase-config.sh
# Fix VITE_FIREBASE_CONFIG in .env file

echo "🔧 Fixing VITE_FIREBASE_CONFIG in .env"
echo "======================================"

# Source .env to get individual values
if [ -f .env ]; then
    set -a
    source .env
    set +a
else
    echo "❌ .env file not found!"
    exit 1
fi

# Check if we have all required individual values
required_vars=(
    "VITE_FIREBASE_PROJECT_ID"
    "VITE_FIREBASE_API_KEY"
    "VITE_FIREBASE_AUTH_DOMAIN"
    "VITE_FIREBASE_STORAGE_BUCKET"
    "VITE_FIREBASE_MESSAGING_SENDER_ID"
    "VITE_FIREBASE_APP_ID"
)

missing=false
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing: $var"
        missing=true
    fi
done

if $missing; then
    echo "Cannot generate VITE_FIREBASE_CONFIG - missing required variables"
    exit 1
fi

# Generate the correct JSON config
FIREBASE_CONFIG="{\"projectId\":\"${VITE_FIREBASE_PROJECT_ID}\",\"apiKey\":\"${VITE_FIREBASE_API_KEY}\",\"authDomain\":\"${VITE_FIREBASE_AUTH_DOMAIN}\",\"storageBucket\":\"${VITE_FIREBASE_STORAGE_BUCKET}\",\"messagingSenderId\":\"${VITE_FIREBASE_MESSAGING_SENDER_ID}\",\"appId\":\"${VITE_FIREBASE_APP_ID}\"}"

echo ""
echo "📝 Generated config:"
echo "$FIREBASE_CONFIG" | jq .

# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Remove old VITE_FIREBASE_CONFIG lines
sed -i.tmp '/^VITE_FIREBASE_CONFIG=/d' .env

# Add the new config
echo "VITE_FIREBASE_CONFIG=$FIREBASE_CONFIG" >> .env

echo ""
echo "✅ Updated VITE_FIREBASE_CONFIG in .env"

# Verify it's valid
echo ""
echo "🔍 Verifying..."
if grep "^VITE_FIREBASE_CONFIG=" .env | cut -d'=' -f2- | jq . >/dev/null 2>&1; then
    echo "✅ VITE_FIREBASE_CONFIG is now valid JSON!"
else
    echo "❌ Something went wrong - VITE_FIREBASE_CONFIG is still invalid"
fi

# Clean up
rm -f .env.tmp

echo ""
echo "💡 Next steps:"
echo "1. Restart your development server"
echo "2. The dashboard should now connect to Firebase properly"
echo "3. To sync with GSM: gcloud auth login && ./scripts/sync-firebase-secrets.sh" 