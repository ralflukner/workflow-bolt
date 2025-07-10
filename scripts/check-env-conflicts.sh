#!/opt/homebrew/bin/bash
# scripts/check-env-conflicts.sh

set -e

echo "🔍 Checking for environment variable conflicts..."
echo "=============================================="
echo ""

# Check if these variables are already set in the shell
echo "📊 Checking shell environment variables:"
echo ""

for var in VITE_TEBRA_PASSWORD VITE_TEBRA_WSDL_URL VITE_TEBRA_PROXY_API_KEY; do
    if [ -n "${!var}" ]; then
        echo "⚠️  $var is set in shell: '${!var}'"
        echo "    Length: ${#var}"
    else
        echo "✅ $var is not set in shell"
    fi
done

echo ""
echo "📄 Values in .env file:"
echo ""

for var in VITE_TEBRA_PASSWORD VITE_TEBRA_WSDL_URL VITE_TEBRA_PROXY_API_KEY; do
    value=$(grep "^${var}=" .env | cut -d'=' -f2- || echo "NOT_FOUND")
    echo "$var in .env: '$value'"
done

echo ""
echo "🔧 Let's run the consistency checker with a clean environment..."
echo ""

# Run the consistency checker with only .env values (no shell env vars)
env -i PATH="$PATH" NODE_PATH="$NODE_PATH" HOME="$HOME" \
    GOOGLE_CLOUD_PROJECT="luknerlumina-firebase" \
    node scripts/check-env-gsm-consistency.js | tail -25

echo ""
echo "💡 Solution options:"
echo "1. Unset the conflicting environment variables in your shell"
echo "2. Update the consistency checker to use 'override: true'"
echo "3. Clear the environment variables before running the checker"
echo ""
echo "To unset these variables in your current shell, run:"
echo "unset VITE_TEBRA_PASSWORD VITE_TEBRA_WSDL_URL VITE_TEBRA_PROXY_API_KEY"