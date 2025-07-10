#!/opt/homebrew/bin/bash
# scripts/sync-firebase-secrets.sh
# Ensures Firebase environment variables are consistent between .env and Google Secret Manager

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔥 Firebase Secrets Synchronization Tool${NC}"
echo "========================================"

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-luknerlumina-firebase}"
echo -e "${YELLOW}📁 Using Google Cloud project: ${PROJECT_ID}${NC}"

# Firebase-related environment variables
FIREBASE_VARS=(
    "VITE_FIREBASE_PROJECT_ID"
    "VITE_FIREBASE_API_KEY"
    "VITE_FIREBASE_AUTH_DOMAIN"
    "VITE_FIREBASE_STORAGE_BUCKET"
    "VITE_FIREBASE_MESSAGING_SENDER_ID"
    "VITE_FIREBASE_APP_ID"
    "VITE_FIREBASE_CONFIG"
)

# Function to check if secret exists in GSM
secret_exists() {
    local secret_name="$1"
    gcloud secrets describe "$secret_name" --project="$PROJECT_ID" &>/dev/null
}

# Function to create or update a secret in GSM
update_gsm_secret() {
    local secret_name="$1"
    local secret_value="$2"
    
    if secret_exists "$secret_name"; then
        echo -e "${YELLOW}  🔄 Updating existing secret: $secret_name${NC}"
        echo -n "$secret_value" | gcloud secrets versions add "$secret_name" --data-file=- --project="$PROJECT_ID"
    else
        echo -e "${GREEN}  ➕ Creating new secret: $secret_name${NC}"
        echo -n "$secret_value" | gcloud secrets create "$secret_name" --data-file=- --project="$PROJECT_ID"
    fi
}

# Function to get secret from GSM
get_gsm_secret() {
    local secret_name="$1"
    gcloud secrets versions access latest --secret="$secret_name" --project="$PROJECT_ID" 2>/dev/null || echo ""
}

# Function to update .env file
update_env_var() {
    local key="$1"
    local value="$2"
    
    # Escape special characters
    local escaped_value="${value//\\/\\\\}"
    escaped_value="${escaped_value//\//\\/}"
    escaped_value="${escaped_value//&/\\&}"
    escaped_value="${escaped_value//\$/\\\$}"
    
    if grep -q "^${key}=" .env; then
        sed -i.tmp "s|^${key}=.*|${key}=${escaped_value}|" .env
        echo -e "${GREEN}  ✅ Updated in .env: ${key}${NC}"
    else
        echo "${key}=${value}" >> .env
        echo -e "${GREEN}  ➕ Added to .env: ${key}${NC}"
    fi
}

# Main sync logic
echo ""
echo -e "${BLUE}1️⃣  Checking current state...${NC}"
echo "--------------------------------"

# Check which variables exist in .env and GSM
for var in "${FIREBASE_VARS[@]}"; do
    env_value="${!var}"
    gsm_value=$(get_gsm_secret "$var")
    
    if [[ -z "$env_value" ]] && [[ -z "$gsm_value" ]]; then
        echo -e "${RED}❌ $var missing from both .env and GSM${NC}"
    elif [[ -z "$env_value" ]]; then
        echo -e "${YELLOW}⚠️  $var missing from .env (exists in GSM)${NC}"
    elif [[ -z "$gsm_value" ]]; then
        echo -e "${YELLOW}⚠️  $var missing from GSM (exists in .env)${NC}"
    elif [[ "$env_value" != "$gsm_value" ]]; then
        echo -e "${YELLOW}⚠️  $var differs between .env and GSM${NC}"
    else
        echo -e "${GREEN}✅ $var is consistent${NC}"
    fi
done

echo ""
echo -e "${BLUE}2️⃣  Sync Options:${NC}"
echo "--------------------------------"
echo "1) Sync from .env to GSM (push local values to cloud)"
echo "2) Sync from GSM to .env (pull cloud values to local)"
echo "3) Generate VITE_FIREBASE_CONFIG from individual values"
echo "4) Exit without changes"
echo ""
read -p "Select option (1-4): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}📤 Syncing from .env to GSM...${NC}"
        
        # First, check if we have all individual Firebase values
        missing_vars=()
        for var in "${FIREBASE_VARS[@]:0:6}"; do  # Skip VITE_FIREBASE_CONFIG
            if [[ -z "${!var}" ]]; then
                missing_vars+=("$var")
            fi
        done
        
        if [[ ${#missing_vars[@]} -gt 0 ]]; then
            echo -e "${RED}❌ Missing required variables in .env:${NC}"
            printf '%s\n' "${missing_vars[@]}"
            echo -e "${YELLOW}Please add these to your .env file first.${NC}"
            exit 1
        fi
        
        # Update GSM with .env values
        for var in "${FIREBASE_VARS[@]:0:6}"; do
            value="${!var}"
            if [[ -n "$value" ]]; then
                update_gsm_secret "$var" "$value"
            fi
        done
        
        # Generate and update VITE_FIREBASE_CONFIG
        echo -e "${BLUE}🔧 Generating VITE_FIREBASE_CONFIG...${NC}"
        FIREBASE_CONFIG="{\"projectId\":\"${VITE_FIREBASE_PROJECT_ID}\",\"apiKey\":\"${VITE_FIREBASE_API_KEY}\",\"authDomain\":\"${VITE_FIREBASE_AUTH_DOMAIN}\",\"storageBucket\":\"${VITE_FIREBASE_STORAGE_BUCKET}\",\"messagingSenderId\":\"${VITE_FIREBASE_MESSAGING_SENDER_ID}\",\"appId\":\"${VITE_FIREBASE_APP_ID}\"}"
        update_env_var "VITE_FIREBASE_CONFIG" "$FIREBASE_CONFIG"
        update_gsm_secret "VITE_FIREBASE_CONFIG" "$FIREBASE_CONFIG"
        ;;
        
    2)
        echo ""
        echo -e "${BLUE}📥 Syncing from GSM to .env...${NC}"
        
        # Backup current .env
        cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Update .env with GSM values
        for var in "${FIREBASE_VARS[@]}"; do
            gsm_value=$(get_gsm_secret "$var")
            if [[ -n "$gsm_value" ]]; then
                update_env_var "$var" "$gsm_value"
            else
                echo -e "${YELLOW}  ⚠️  No value in GSM for $var${NC}"
            fi
        done
        ;;
        
    3)
        echo ""
        echo -e "${BLUE}🔧 Generating VITE_FIREBASE_CONFIG...${NC}"
        
        # Check if we have all required individual values
        missing_vars=()
        for var in "${FIREBASE_VARS[@]:0:6}"; do
            if [[ -z "${!var}" ]]; then
                missing_vars+=("$var")
            fi
        done
        
        if [[ ${#missing_vars[@]} -gt 0 ]]; then
            echo -e "${RED}❌ Missing required variables:${NC}"
            printf '%s\n' "${missing_vars[@]}"
            exit 1
        fi
        
        FIREBASE_CONFIG="{\"projectId\":\"${VITE_FIREBASE_PROJECT_ID}\",\"apiKey\":\"${VITE_FIREBASE_API_KEY}\",\"authDomain\":\"${VITE_FIREBASE_AUTH_DOMAIN}\",\"storageBucket\":\"${VITE_FIREBASE_STORAGE_BUCKET}\",\"messagingSenderId\":\"${VITE_FIREBASE_MESSAGING_SENDER_ID}\",\"appId\":\"${VITE_FIREBASE_APP_ID}\"}"
        
        echo -e "${GREEN}Generated config:${NC}"
        echo "$FIREBASE_CONFIG" | jq .
        
        read -p "Update .env and GSM with this config? (y/n): " confirm
        if [[ "$confirm" == "y" ]]; then
            update_env_var "VITE_FIREBASE_CONFIG" "$FIREBASE_CONFIG"
            update_gsm_secret "VITE_FIREBASE_CONFIG" "$FIREBASE_CONFIG"
        fi
        ;;
        
    4)
        echo -e "${YELLOW}👋 Exiting without changes.${NC}"
        exit 0
        ;;
        
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

# Clean up temp files
rm -f .env.tmp

echo ""
echo -e "${BLUE}3️⃣  Verification:${NC}"
echo "--------------------------------"

# Run consistency check for Firebase vars
all_consistent=true
for var in "${FIREBASE_VARS[@]}"; do
    env_value="${!var}"
    gsm_value=$(get_gsm_secret "$var")
    
    if [[ "$env_value" == "$gsm_value" ]] && [[ -n "$env_value" ]]; then
        echo -e "${GREEN}✅ $var is consistent${NC}"
    else
        echo -e "${RED}❌ $var is NOT consistent${NC}"
        all_consistent=false
    fi
done

echo ""
if $all_consistent; then
    echo -e "${GREEN}✅ All Firebase secrets are now synchronized!${NC}"
    echo ""
    echo -e "${YELLOW}💡 Next steps:${NC}"
    echo "   1. Reload your environment: source .env"
    echo "   2. Restart your development server"
    echo "   3. The dashboard should now connect to Firebase properly"
else
    echo -e "${RED}❌ Some secrets are still not synchronized${NC}"
    echo -e "${YELLOW}Please run this script again or manually fix the issues.${NC}"
fi 