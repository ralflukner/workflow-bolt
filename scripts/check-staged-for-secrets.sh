#!/bin/bash

# Script to check staged files for secrets before committing
# This script can be used as a pre-commit hook

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Checking staged files for secrets...${NC}"

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only)

if [ -z "$STAGED_FILES" ]; then
    echo -e "${YELLOW}No files staged for commit.${NC}"
    exit 0
fi

# Patterns to check for
PATTERNS=(
    # API Keys
    "api[_-]key"
    "apikey"
    "key[-_]?[0-9a-zA-Z]{16,}"
    "[a-zA-Z0-9]{32,}"
    
    # Firebase
    "FIREBASE_API_KEY"
    "FIREBASE_AUTH_DOMAIN"
    "FIREBASE_PROJECT_ID"
    "FIREBASE_STORAGE_BUCKET"
    "FIREBASE_MESSAGING_SENDER_ID"
    "FIREBASE_APP_ID"
    "FIREBASE_CONFIG"
    
    # Google Cloud
    "GOOGLE_CLOUD_PROJECT"
    "GOOGLE_APPLICATION_CREDENTIALS"
    
    # Tebra
    "TEBRA_PROXY_API_KEY"
    "TEBRA_USERNAME"
    "TEBRA_PASSWORD"
    "TEBRA_CUSTOMER_KEY"
    
    # Generic secrets
    "password"
    "passwd"
    "secret"
    "credential"
    "token"
    "auth"
    
    # Environment variables
    "\.env"
    "\.env\."
    
    # Private keys
    "BEGIN PRIVATE KEY"
    "BEGIN RSA PRIVATE KEY"
    "BEGIN DSA PRIVATE KEY"
    "BEGIN EC PRIVATE KEY"
    "BEGIN PGP PRIVATE KEY"
)

# Files to ignore (e.g., this script itself, documentation about secrets)
IGNORE_FILES=(
    "scripts/check-staged-for-secrets.sh"
    "docs/secrets-management.md"
    "scripts/setup-required-secrets.sh"
    "scripts/generate-firebase-config.sh"
    "scripts/clean-git-secrets.sh"
    "scripts/README.md"
    "docs/FIREBASE_CLI_AUTH.md"
)

# Function to check if a file should be ignored
should_ignore() {
    local file="$1"
    for ignore_file in "${IGNORE_FILES[@]}"; do
        if [[ "$file" == "$ignore_file" ]]; then
            return 0
        fi
    done
    return 1
}

# Check each staged file
FOUND_SECRETS=0

for FILE in $STAGED_FILES; do
    # Skip ignored files
    if should_ignore "$FILE"; then
        echo -e "${YELLOW}Skipping ignored file: $FILE${NC}"
        continue
    fi
    
    # Skip binary files
    if file "$FILE" | grep -q "binary"; then
        echo -e "${YELLOW}Skipping binary file: $FILE${NC}"
        continue
    fi
    
    # Check for patterns
    for PATTERN in "${PATTERNS[@]}"; do
        MATCHES=$(git diff --cached "$FILE" | grep -i "$PATTERN" || true)
        if [ ! -z "$MATCHES" ]; then
            echo -e "${RED}Potential secret found in $FILE:${NC}"
            echo "$MATCHES" | grep -i --color "$PATTERN"
            FOUND_SECRETS=1
        fi
    done
done

if [ $FOUND_SECRETS -eq 0 ]; then
    echo -e "${GREEN}No secrets found in staged files.${NC}"
    exit 0
else
    echo -e "${RED}Secrets found in staged files. Please remove them before committing.${NC}"
    echo -e "${YELLOW}Options:${NC}"
    echo "1. Unstage the files: git restore --staged <file>"
    echo "2. Edit the files to remove secrets and stage again"
    echo "3. Use environment variables or Google Secret Manager instead"
    exit 1
fi