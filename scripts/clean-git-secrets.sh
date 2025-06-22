#!/bin/bash

# Script to remove exposed secrets from Git history
# WARNING: This will rewrite Git history!

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}WARNING: This script will rewrite Git history!${NC}"
echo -e "${YELLOW}Make sure you have a backup and coordinate with your team.${NC}"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Create backup
echo -e "${YELLOW}Creating backup branch...${NC}"
git branch backup-before-clean-$(date +%Y%m%d-%H%M%S)

# The secrets to remove
SECRETS=(
    "<TEBRA_USERNAME_PLACEHOLDER>"
    "<TEBRA_PASSWORD_PLACEHOLDER>"
)

# Files that contained secrets
TARGET_FILE="soapui/Tebra-EHR-soapui-project.xml"

echo -e "${YELLOW}Cleaning secrets from Git history...${NC}"

# Use git filter-branch to clean the specific file
git filter-branch --force --index-filter \
    "git rm --cached --ignore-unmatch $TARGET_FILE || true" \
    --prune-empty --tag-name-filter cat -- --all

# Re-add the cleaned version
echo -e "${YELLOW}Re-adding cleaned file...${NC}"
git add $TARGET_FILE
git commit -m "Re-add cleaned SoapUI project file" || true

echo -e "${GREEN}Git history cleaned!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the changes: git log --oneline"
echo "2. Force push to remote: git push --force-with-lease origin $(git branch --show-current)"
echo "3. Notify team members to re-clone or reset their local repos"
echo ""
echo -e "${RED}IMPORTANT: The secrets are still exposed on GitHub!${NC}"
echo "You must:"
echo "1. Rotate the credentials in Tebra immediately"
echo "2. Update the secrets in Google Secret Manager"
echo "3. Update your local .env file with new credentials"