#!/bin/bash

# Script to verify no secrets are hardcoded in SoapUI files
# Run this before committing to ensure security

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}=== Verifying No Hardcoded Secrets ===${NC}"
echo ""

# Load actual secrets from .env to check against
if [ -f "$PROJECT_ROOT/.env" ]; then
    TEBRA_USERNAME=$(grep VITE_TEBRA_USERNAME "$PROJECT_ROOT/.env" | cut -d '=' -f2)
    TEBRA_PASSWORD=$(grep VITE_TEBRA_PASSWORD "$PROJECT_ROOT/.env" | cut -d '=' -f2)
    TEBRA_CUSTOMER_KEY=$(grep -E "VITE_TEBRA_CUSTOMER_KEY|REACT_APP_TEBRA_CUSTOMERKEY" "$PROJECT_ROOT/.env" | head -1 | cut -d '=' -f2)
fi

# Files to check
FILES_TO_CHECK=(
    "soapui/Tebra-EHR-soapui-project.xml"
    "soapui/*.xml"
)

FOUND_SECRETS=0

# Function to check file for secrets
check_file() {
    local file="$1"
    local full_path="$PROJECT_ROOT/$file"
    
    if [ -f "$full_path" ]; then
        echo -e "Checking: $file"
        
        # Check for actual secrets if we have them
        if [ ! -z "$TEBRA_USERNAME" ] && grep -q "$TEBRA_USERNAME" "$full_path"; then
            echo -e "${RED}  ✗ Found hardcoded username: $TEBRA_USERNAME${NC}"
            FOUND_SECRETS=$((FOUND_SECRETS + 1))
        fi
        
        if [ ! -z "$TEBRA_PASSWORD" ] && grep -q "$TEBRA_PASSWORD" "$full_path"; then
            echo -e "${RED}  ✗ Found hardcoded password${NC}"
            FOUND_SECRETS=$((FOUND_SECRETS + 1))
        fi
        
        if [ ! -z "$TEBRA_CUSTOMER_KEY" ] && grep -q "$TEBRA_CUSTOMER_KEY" "$full_path"; then
            echo -e "${RED}  ✗ Found hardcoded customer key: $TEBRA_CUSTOMER_KEY${NC}"
            FOUND_SECRETS=$((FOUND_SECRETS + 1))
        fi
        
        # Check for common patterns that look like secrets
        if grep -E "password.*=.*[A-Za-z0-9]{10,}" "$full_path" | grep -v "\${TEBRA_PASSWORD}" > /dev/null; then
            echo -e "${YELLOW}  ⚠ Found potential hardcoded password pattern${NC}"
        fi
        
        if grep -E "@.*\.com.*Password" "$full_path" | grep -v "\${TEBRA_USERNAME}" > /dev/null; then
            echo -e "${YELLOW}  ⚠ Found potential email/password combination${NC}"
        fi
        
        # Check that placeholders are present
        if grep -q "\${TEBRA_USERNAME}\|\${TEBRA_PASSWORD}\|\${TEBRA_CUSTOMER_KEY}" "$full_path"; then
            echo -e "${GREEN}  ✓ Found placeholder variables${NC}"
        fi
    fi
}

# Check all files
for pattern in "${FILES_TO_CHECK[@]}"; do
    for file in $PROJECT_ROOT/$pattern; do
        if [ -f "$file" ]; then
            relative_path="${file#$PROJECT_ROOT/}"
            check_file "$relative_path"
        fi
    done
done

echo ""

# Summary
if [ $FOUND_SECRETS -eq 0 ]; then
    echo -e "${GREEN}✓ No hardcoded secrets found!${NC}"
    echo -e "${GREEN}Safe to commit.${NC}"
    exit 0
else
    echo -e "${RED}✗ Found $FOUND_SECRETS hardcoded secret(s)!${NC}"
    echo -e "${RED}DO NOT COMMIT! Run ./scripts/soapui-test.sh to test with temporary credentials.${NC}"
    exit 1
fi