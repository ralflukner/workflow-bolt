#!/opt/homebrew/bin/bash
# scripts/fix-remaining-mismatches-with-verify.sh

set -e

echo "🔧 Fixing remaining mismatches between .env and GSM with verification..."
echo "======================================================================"

# Backup current .env
BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
cp .env "$BACKUP_FILE"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results using parallel arrays instead of associative array
declare -a result_keys
declare -a result_values
total=0
success=0

# Function to store result
store_result() {
    local key="$1"
    local value="$2"
    result_keys+=("$key")
    result_values+=("$value")
}

# Function to verify values match
verify_match() {
    local env_key="$1"
    local gsm_key="${2:-$1}"

    # Get value from .env (remove quotes if present)
    local env_value
    env_value=$(grep "^${env_key}=" .env | cut -d'=' -f2-)
    env_value="${env_value#\"}"  # Remove leading quote
    env_value="${env_value%\"}"  # Remove trailing quote

    # Get value from GSM
    local gsm_value
    gsm_value=$(gcloud secrets versions access latest --secret="${gsm_key}" 2>/dev/null || echo "")

    # Special handling for private key - normalize newlines
    if [[ "$env_key" == "GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY" ]]; then
        # Convert \n to actual newlines for comparison
        env_value=$(echo -e "$env_value")
    fi

    # Compare values
    if [ "$env_value" = "$gsm_value" ]; then
        echo -e "   ${GREEN}✅ VERIFIED: Values match exactly${NC}"
        return 0
    else
        echo -e "   ${RED}❌ MISMATCH: Values still differ${NC}"
        echo "   ENV length: ${#env_value} chars"
        echo "   GSM length: ${#gsm_value} chars"

        # Show first difference
        for (( i=0; i<${#env_value} && i<${#gsm_value}; i++ )); do
            if [ "${env_value:$i:1}" != "${gsm_value:$i:1}" ]; then
                echo -e "   ${YELLOW}First difference at position $i${NC}"
                echo "   ENV char: '${env_value:$i:1}' ($(printf %d "'${env_value:$i:1}"))"
                echo "   GSM char: '${gsm_value:$i:1}' ($(printf %d "'${gsm_value:$i:1}"))"
                break
            fi
        done
        return 1
    fi
}

# Function to update and verify
update_and_verify() {
    local env_key="$1"
    local gsm_key="${2:-$1}"

    echo ""
    echo "📝 Processing $env_key..."

    # Get GSM value
    local gsm_value
    gsm_value=$(gcloud secrets versions access latest --secret="${gsm_key}" 2>/dev/null || echo "")

    if [ -z "$gsm_value" ]; then
        echo -e "   ${RED}❌ No value in GSM for $gsm_key${NC}"
        return 1
    fi

    # Show preview
    echo "   GSM value preview: ${gsm_value:0:50}..."

    # Update .env
    if grep -q "^${env_key}=" .env; then
        sed -i.tmp "s|^${env_key}=.*|${env_key}=${gsm_value}|" .env
    else
        echo "${env_key}=${gsm_value}" >> .env
    fi

    # Verify the update
    verify_match "$env_key" "$gsm_key"
    return $?
}

# 1. Fix Auth0 values
echo "🔐 Auth0 Configuration:"
for key in "VITE_AUTH0_REDIRECT_URI" "VITE_AUTH0_AUDIENCE"; do
    update_and_verify "$key"
    result=$?
    store_result "$key" "$result"
    ((total++))
    [ "$result" -eq 0 ] && ((success++))
done

# Special handling for AUTH0_SCOPE
echo ""
echo "📝 Processing VITE_AUTH0_SCOPE..."
SCOPE_VALUE=$(gcloud secrets versions access latest --secret="VITE_AUTH0_SCOPE" 2>/dev/null || echo "")
if [ -n "$SCOPE_VALUE" ]; then
    # Check if value contains spaces and needs quotes
    if [[ "$SCOPE_VALUE" == *" "* ]] && [[ "$SCOPE_VALUE" != \"*\" ]]; then
        sed -i.tmp "s|^VITE_AUTH0_SCOPE=.*|VITE_AUTH0_SCOPE=\"${SCOPE_VALUE}\"|" .env
    else
        sed -i.tmp "s|^VITE_AUTH0_SCOPE=.*|VITE_AUTH0_SCOPE=${SCOPE_VALUE}|" .env
    fi
    verify_match "VITE_AUTH0_SCOPE"
    result=$?
    store_result "VITE_AUTH0_SCOPE" "$result"
    ((total++))
    [ "$result" -eq 0 ] && ((success++))
fi

# 2. Fix Tebra WSDL URL
echo ""
echo "🏥 Tebra Configuration:"
update_and_verify "VITE_TEBRA_WSDL_URL"
result=$?
store_result "VITE_TEBRA_WSDL_URL" "$result"
((total++))
[ "$result" -eq 0 ] && ((success++))

# 3. Fix encryption keys
echo ""
echo "🔒 Encryption Keys:"
PATIENT_KEY=$(gcloud secrets versions access latest --secret="PATIENT_ENCRYPTION_KEY" 2>/dev/null || echo "")
if [ -n "$PATIENT_KEY" ]; then
    echo "   Updating both REACT_APP and VITE patient encryption keys..."
    sed -i.tmp "s|^REACT_APP_PATIENT_ENCRYPTION_KEY=.*|REACT_APP_PATIENT_ENCRYPTION_KEY=${PATIENT_KEY}|" .env
    sed -i.tmp "s|^VITE_PATIENT_ENCRYPTION_KEY=.*|VITE_PATIENT_ENCRYPTION_KEY=${PATIENT_KEY}|" .env

    # Verify both
    verify_match "REACT_APP_PATIENT_ENCRYPTION_KEY" "PATIENT_ENCRYPTION_KEY"
    result=$?
    store_result "REACT_APP_PATIENT_ENCRYPTION_KEY" "$result"
    ((total++))
    [ "$result" -eq 0 ] && ((success++))

    verify_match "VITE_PATIENT_ENCRYPTION_KEY" "PATIENT_ENCRYPTION_KEY"
    result=$?
    store_result "VITE_PATIENT_ENCRYPTION_KEY" "$result"
    ((total++))
    [ "$result" -eq 0 ] && ((success++))
fi

# 4. Fix Tebra Proxy API Key
echo ""
echo "🔑 API Keys:"
update_and_verify "VITE_TEBRA_PROXY_API_KEY" "TEBRA_PROXY_API_KEY"
result=$?
store_result "VITE_TEBRA_PROXY_API_KEY" "$result"
((total++))
[ "$result" -eq 0 ] && ((success++))

# 5. Fix Gmail Service Account Private Key
echo ""
echo "📧 Gmail Service Account Private Key:"
PRIVATE_KEY=$(gcloud secrets versions access latest --secret="GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY" 2>/dev/null || echo "")
if [ -n "$PRIVATE_KEY" ]; then
    # Escape the private key properly
    ESCAPED_KEY="${PRIVATE_KEY//\\/\\\\}"     # Escape backslashes
    ESCAPED_KEY="${ESCAPED_KEY//\"/\\\"}"     # Escape quotes
    ESCAPED_KEY="${ESCAPED_KEY//$'\n'/\\n}"   # Convert newlines to \n

    # Update in .env with quotes
    if grep -q "^GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY=" .env; then
        sed -i.tmp "s|^GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY=.*|GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY=\"${ESCAPED_KEY}\"|" .env
    else
        echo "GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY=\"${ESCAPED_KEY}\"" >> .env
    fi

    verify_match "GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY"
    result=$?
    store_result "GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY" "$result"
    ((total++))
    [ "$result" -eq 0 ] && ((success++))
fi

# 6. Fix Firebase Config
echo ""
echo "🔥 Firebase Config:"
update_and_verify "VITE_FIREBASE_CONFIG"
result=$?
store_result "VITE_FIREBASE_CONFIG" "$result"
((total++))
[ "$result" -eq 0 ] && ((success++))

# Clean up
rm -f .env.tmp

# Final summary
echo ""
echo "========================================"
echo "📊 VERIFICATION SUMMARY"
echo "========================================"
echo "Total keys processed: $total"
echo -e "Successfully synced:  ${GREEN}$success${NC}"
echo -e "Failed to sync:      ${RED}$((total - success))${NC}"
echo ""

# Show failed keys
if [ "$success" -ne "$total" ]; then
    echo -e "${RED}Failed keys:${NC}"
    for i in "${!result_keys[@]}"; do
        if [ "${result_values[$i]}" -ne 0 ]; then
            echo "  - ${result_keys[$i]}"
        fi
    done
    echo ""
fi

# Run full verification
echo "🔍 Running full environment verification..."
echo "----------------------------------------"
./scripts/verify-env-gsm-consistency.sh | tail -n 10

# Final status
echo ""
if [ "$success" -eq "$total" ]; then
    echo -e "${GREEN}✅ All values successfully synced and verified!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some values failed to sync properly${NC}"
    echo "💡 To review changes: diff $BACKUP_FILE .env"
    exit 1
fi