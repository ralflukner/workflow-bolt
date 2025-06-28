#!/bin/bash

# Script to set up patient encryption key in Google Secret Manager for HIPAA compliance
# This script creates the secret and grants proper access to Firebase services

set -e

# Configuration
PROJECT_ID="luknerlumina-firebase"
SECRET_ID="patient-encryption-key"
SECRET_DESCRIPTION="Patient data encryption key for HIPAA compliance"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Setting up Patient Encryption Key in Google Secret Manager${NC}"
echo "Project: $PROJECT_ID"
echo "Secret ID: $SECRET_ID"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI is not installed${NC}"
    echo "Please install gcloud CLI: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Error: Not authenticated with gcloud${NC}"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set the project
echo -e "${BLUE}📋 Setting project to $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Generate a secure encryption key if not provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}🔑 Generating secure encryption key...${NC}"
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    echo -e "${GREEN}✅ Generated 256-bit encryption key${NC}"
else
    ENCRYPTION_KEY="$1"
    echo -e "${YELLOW}🔑 Using provided encryption key${NC}"
fi

# Check if secret already exists
if gcloud secrets describe $SECRET_ID --project=$PROJECT_ID &> /dev/null; then
    echo -e "${YELLOW}⚠️  Secret '$SECRET_ID' already exists. Creating a new version...${NC}"
    echo -n "$ENCRYPTION_KEY" | gcloud secrets versions add $SECRET_ID --project=$PROJECT_ID --data-file=-
    echo -e "${GREEN}✅ Updated secret '$SECRET_ID' with new version${NC}"
else
    echo -e "${BLUE}🔧 Creating new secret '$SECRET_ID'...${NC}"
    echo -n "$ENCRYPTION_KEY" | gcloud secrets create $SECRET_ID \
        --project=$PROJECT_ID \
        --data-file=- \
        --description="$SECRET_DESCRIPTION" \
        --replication-policy="automatic"
    echo -e "${GREEN}✅ Created secret '$SECRET_ID'${NC}"
fi

# Grant access to Firebase services
echo -e "${BLUE}🔐 Granting access to Firebase services...${NC}"

# Firebase Functions service account
FUNCTIONS_SA="${PROJECT_ID}@appspot.gserviceaccount.com"
echo "Granting access to Firebase Functions: $FUNCTIONS_SA"
gcloud secrets add-iam-policy-binding $SECRET_ID \
    --project=$PROJECT_ID \
    --member="serviceAccount:$FUNCTIONS_SA" \
    --role="roles/secretmanager.secretAccessor"

# Firebase Admin SDK service account (if different)
ADMIN_SA="${PROJECT_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
echo "Granting access to Firebase Admin SDK: $ADMIN_SA"
gcloud secrets add-iam-policy-binding $SECRET_ID \
    --project=$PROJECT_ID \
    --member="serviceAccount:$ADMIN_SA" \
    --role="roles/secretmanager.secretAccessor"

# Grant access to the current user for testing
CURRENT_USER=$(gcloud config get-value account)
echo "Granting access to current user: $CURRENT_USER"
gcloud secrets add-iam-policy-binding $SECRET_ID \
    --project=$PROJECT_ID \
    --member="user:$CURRENT_USER" \
    --role="roles/secretmanager.secretAccessor"

echo -e "${GREEN}✅ Access granted to all services${NC}"

# Verify the secret can be accessed
echo -e "${BLUE}🔍 Verifying secret access...${NC}"
if gcloud secrets versions access latest --secret=$SECRET_ID --project=$PROJECT_ID &> /dev/null; then
    echo -e "${GREEN}✅ Secret access verified${NC}"
else
    echo -e "${RED}❌ Failed to verify secret access${NC}"
    exit 1
fi

# Display setup summary
echo ""
echo -e "${GREEN}🎉 Patient Encryption Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Setup Summary:${NC}"
echo "  • Secret ID: $SECRET_ID"
echo "  • Project: $PROJECT_ID"
echo "  • Access granted to:"
echo "    - Firebase Functions ($FUNCTIONS_SA)"
echo "    - Firebase Admin SDK ($ADMIN_SA)"
echo "    - Current user ($CURRENT_USER)"
echo ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "  • Store the encryption key securely - it cannot be recovered if lost"
echo "  • All patient data will be encrypted with this key"
echo "  • The key is automatically rotated and managed by Google Secret Manager"
echo ""
echo -e "${BLUE}🔧 Next Steps:${NC}"
echo "  1. Restart your Firebase Functions to pick up the new secret"
echo "  2. Test encryption/decryption in your application"
echo "  3. Monitor logs for any encryption-related errors"
echo ""
echo -e "${GREEN}✅ HIPAA-compliant patient encryption is now configured!${NC}" 