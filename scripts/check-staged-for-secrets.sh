#!/opt/homebrew/bin/bash

# Simple script to check staged files for potential secrets

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Checking staged files for secrets...${NC}"

STAGED_FILES=$(git diff --cached --name-only)

if [ -z "$STAGED_FILES" ]; then
    echo -e "${YELLOW}No files staged for commit.${NC}"
    exit 0
fi

# Ignore these files
IGNORE_FILES=(
    "scripts/check-staged-for-secrets.sh"
    "docs/secrets-management.md"
    "scripts/setup-required-secrets.sh"
    "scripts/generate-firebase-config.sh"
    "scripts/clean-git-secrets.sh"
    "scripts/README.md"
    "docs/FIREBASE_CLI_AUTH.md"
    "package.json"
    "package-lock.json"
)

should_ignore_file() {
    local file="$1"
    for ignore_file in "${IGNORE_FILES[@]}"; do
        if [[ "$file" == "$ignore_file" ]]; then
            return 0
        fi
    done
    return 1
}

FOUND_SECRETS=0

for FILE in $STAGED_FILES; do
    if should_ignore_file "$FILE"; then
        echo -e "${YELLOW}Skipping ignored file: $FILE${NC}"
        continue
    fi

    if file "$FILE" | grep -q "binary"; then
        echo -e "${YELLOW}Skipping binary file: $FILE${NC}"
        continue
    fi

    # Check for obvious secrets in added lines
    while IFS= read -r line; do
        # Remove the leading '+'
        clean_line="${line:1}"
        
        # Skip short lines, comments, and imports
        [[ ${#clean_line} -lt 20 ]] && continue
        [[ "$clean_line" =~ ^[[:space:]]*# ]] && continue
        [[ "$clean_line" =~ ^[[:space:]]*// ]] && continue
        [[ "$clean_line" =~ ^[[:space:]]*import ]] && continue
        
        # Check for PEM blocks
        if echo "$clean_line" | grep -q "BEGIN.*PRIVATE KEY"; then
            echo -e "${RED}Potential secret found in $FILE:${NC}"
            echo "$clean_line"
            FOUND_SECRETS=1
        fi
        
        if echo "$clean_line" | grep -q "BEGIN.*CERTIFICATE"; then
            echo -e "${RED}Potential secret found in $FILE:${NC}"
            echo "$clean_line"
            FOUND_SECRETS=1
        fi
        
        # Check for very long strings that might be keys/tokens (basic check)
        if [[ ${#clean_line} -gt 120 ]] && echo "$clean_line" | grep -q "[A-Za-z0-9]"; then
            # Skip if it contains common non-secret patterns
            if ! echo "$clean_line" | grep -q -i "comment\|description\|example\|test\|mock\|placeholder\|dummy\|https://\|http://\|queryClient\|DocumentRoot\|enabled:\|hasRealData:\|persistenceEnabled"; then
                echo -e "${RED}Potential long secret found in $FILE:${NC}"
                echo "$clean_line"
                FOUND_SECRETS=1
            fi
        fi
        
    done < <(git diff --cached "$FILE" | grep '^+' | grep -v '^+++')
done

if [ $FOUND_SECRETS -eq 0 ]; then
    echo -e "${GREEN}No obvious secrets found in staged files.${NC}"
    exit 0
else
    echo -e "${RED}Potential secrets found in staged files. Please review before committing.${NC}"
    echo -e "${YELLOW}Options:${NC}"
    echo "1. Unstage the files: git restore --staged <file>"
    echo "2. Edit the files to remove secrets and stage again"
    echo "3. Use environment variables or Google Secret Manager instead"
    exit 1
fi