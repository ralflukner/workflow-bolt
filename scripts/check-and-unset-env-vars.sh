#!/opt/homebrew/bin/bash
# scripts/check-and-unset-env-vars.sh

set -e

echo "🔍 Checking for conflicting shell environment variables..."
echo "========================================================"
echo ""

# List of all variables to check
vars=(
    VITE_TEBRA_PASSWORD
    VITE_TEBRA_WSDL_URL
    VITE_TEBRA_PROXY_API_KEY
    VITE_PATIENT_ENCRYPTION_KEY
    GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY
)

echo "📊 Current shell environment variables:"
echo ""

# Check which are set
set_vars=()
for var in "${vars[@]}"; do
    if [ -n "${!var}" ]; then
        echo "⚠️  $var is set in shell"
        echo "    Length: ${#var}"
        set_vars+=("$var")
    else
        echo "✅ $var is not set in shell"
    fi
done

echo ""
echo "🔧 To fix this, run the following command:"
echo ""
echo "unset ${set_vars[*]}"
echo ""
echo "Then run the consistency check again:"
echo "node scripts/check-env-gsm-consistency.js"
echo ""
echo "📝 Or run this all-in-one command:"
echo ""
echo "unset ${set_vars[*]} && node scripts/check-env-gsm-consistency.js"