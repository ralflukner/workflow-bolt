#!/opt/homebrew/bin/bash
# scripts/check-firebase-env-status.sh
# Check Firebase environment variables status

echo "🔥 Firebase Environment Variables Status"
echo "======================================="
echo ""

# Firebase variables to check
FIREBASE_VARS=(
    "VITE_FIREBASE_PROJECT_ID"
    "VITE_FIREBASE_API_KEY"
    "VITE_FIREBASE_AUTH_DOMAIN"
    "VITE_FIREBASE_STORAGE_BUCKET"
    "VITE_FIREBASE_MESSAGING_SENDER_ID"
    "VITE_FIREBASE_APP_ID"
    "VITE_FIREBASE_CONFIG"
)

# Source .env file
if [ -f .env ]; then
    set -a
    source .env
    set +a
else
    echo "❌ .env file not found!"
    exit 1
fi

echo "📋 Checking .env file:"
echo "----------------------"

missing_vars=()
for var in "${FIREBASE_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        if [ "$var" == "VITE_FIREBASE_CONFIG" ]; then
            # Check if it's valid JSON
            if echo "${!var}" | jq . >/dev/null 2>&1; then
                echo "✅ $var = [Valid JSON]"
            else
                echo "⚠️  $var = [Invalid JSON]"
            fi
        else
            echo "✅ $var = ${!var:0:20}..."
        fi
    else
        echo "❌ $var is missing"
        missing_vars+=("$var")
    fi
done

echo ""
echo "📊 Summary:"
echo "-----------"
echo "Total variables: ${#FIREBASE_VARS[@]}"
echo "Present: $((${#FIREBASE_VARS[@]} - ${#missing_vars[@]}))"
echo "Missing: ${#missing_vars[@]}"

if [ ${#missing_vars[@]} -eq 0 ]; then
    echo ""
    echo "✅ All Firebase environment variables are present!"
    
    # Check if VITE_FIREBASE_CONFIG exists or needs to be generated
    if [ -z "$VITE_FIREBASE_CONFIG" ]; then
        echo ""
        echo "⚠️  VITE_FIREBASE_CONFIG is missing. Generating from individual values..."
        
        FIREBASE_CONFIG="{\"projectId\":\"${VITE_FIREBASE_PROJECT_ID}\",\"apiKey\":\"${VITE_FIREBASE_API_KEY}\",\"authDomain\":\"${VITE_FIREBASE_AUTH_DOMAIN}\",\"storageBucket\":\"${VITE_FIREBASE_STORAGE_BUCKET}\",\"messagingSenderId\":\"${VITE_FIREBASE_MESSAGING_SENDER_ID}\",\"appId\":\"${VITE_FIREBASE_APP_ID}\"}"
        
        echo ""
        echo "Generated config:"
        echo "$FIREBASE_CONFIG" | jq .
        
        echo ""
        echo "To add this to your .env file, run:"
        echo "echo 'VITE_FIREBASE_CONFIG=$FIREBASE_CONFIG' >> .env"
    fi
else
    echo ""
    echo "❌ Missing variables:"
    printf '%s\n' "${missing_vars[@]}"
    echo ""
    echo "These variables are required for Firebase to work properly."
fi

echo ""
echo "💡 Next steps:"
echo "1. If variables are missing, add them to your .env file"
echo "2. To sync with Google Secret Manager, first authenticate:"
echo "   gcloud auth login"
echo "3. Then run: ./scripts/sync-firebase-secrets.sh" 