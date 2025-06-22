#!/opt/homebrew/bin/bash
# scripts/fix-gsm-migration-values.sh

set -e

echo "🔧 Fixing GSM migration values..."
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to check and fix a secret
fix_secret() {
    local new_secret="$1"
    local old_secret="$2"

    echo ""
    echo "📝 Checking $new_secret..."

    # Get current value
    local current_value
    current_value=$(gcloud secrets versions access latest --secret="$new_secret" 2>/dev/null || echo "NOT_FOUND")

    if [ "$current_value" = "NOT_FOUND" ]; then
        echo -e "   ${RED}❌ Secret doesn't exist${NC}"
        return 1
    fi

    # Check if it's a placeholder
    if [[ "$current_value" == "<value>" ]] || [[ "$current_value" == "null" ]] || [[ -z "$current_value" ]]; then
        echo -e "   ${YELLOW}⚠️  Found placeholder value, checking old secret: $old_secret${NC}"

        # Get value from old secret
        local old_value
        old_value=$(gcloud secrets versions access latest --secret="$old_secret" 2>/dev/null || echo "NOT_FOUND")

        if [ "$old_value" = "NOT_FOUND" ]; then
            echo -e "   ${RED}❌ Old secret not found${NC}"
            return 1
        fi

        if [[ "$old_value" == "<value>" ]] || [[ "$old_value" == "null" ]] || [[ -z "$old_value" ]]; then
            echo -e "   ${RED}❌ Old secret also has placeholder${NC}"
            return 1
        fi

        # Update with real value
        echo -n "$old_value" | gcloud secrets versions add "$new_secret" --data-file=-
        echo -e "   ${GREEN}✅ Updated with actual value${NC}"
    else
        echo -e "   ${GREEN}✅ Already has a real value${NC}"
        echo "   Preview: ${current_value:0:30}..."
    fi
}

# Check what's in the mismatched secrets
echo "🔍 Diagnosing mismatched secrets..."

# Tebra username/password
fix_secret "VITE_TEBRA_USERNAME" "tebra-username"
fix_secret "VITE_TEBRA_PASSWORD" "tebra-password"
fix_secret "VITE_TEBRA_WSDL_URL" "TEBRA_WSDL_URL"

# These were already fixed but let's verify
echo ""
echo "🔍 Verifying previously fixed secrets..."
fix_secret "VITE_PATIENT_ENCRYPTION_KEY" "PATIENT_ENCRYPTION_KEY"
fix_secret "VITE_TEBRA_PROXY_API_KEY" "TEBRA_PROXY_API_KEY"
fix_secret "VITE_FIREBASE_CONFIG" "FIREBASE_CONFIG"

echo ""
echo "📊 Current status of all VITE_ secrets:"
echo "--------------------------------------"
for secret in $(gcloud secrets list --format="value(name)" | grep "^VITE_" | sort); do
    value=$(gcloud secrets versions access latest --secret="$secret" 2>/dev/null || echo "ERROR")
    if [[ "$value" == "<value>" ]] || [[ "$value" == "null" ]] || [[ -z "$value" ]]; then
        echo -e "${RED}❌ $secret = PLACEHOLDER${NC}"
    elif [[ "$value" == "ERROR" ]]; then
        echo -e "${RED}❌ $secret = ERROR${NC}"
    else
        echo -e "${GREEN}✅ $secret = ${value:0:30}...${NC}"
    fi
done

echo ""
echo "🔄 Re-pulling secrets to .env..."
node scripts/pull-secrets.js

echo ""
echo "🧹 Removing any duplicate entries..."
python3 -c "
lines_seen = set()
with open('.env', 'r') as f:
    lines = f.readlines()
unique_lines = []
for line in lines:
    if '=' in line:
        key = line.split('=')[0]
        if key not in lines_seen:
            lines_seen.add(key)
            unique_lines.append(line)
    else:
        unique_lines.append(line)
with open('.env', 'w') as f:
    f.writelines(unique_lines)
print('Cleaned .env file')
"

echo ""
echo "🔍 Final consistency check..."
node scripts/check-env-gsm-consistency.js | tail -n 25