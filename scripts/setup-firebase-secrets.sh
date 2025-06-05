#!/bin/bash

# Firebase Configuration Setup Script for Google Secret Manager
# HIPAA-Compliant Configuration Management

set -e

# Configuration
PROJECT_ID="luknerlumina-firebase"
SECRET_NAME="firebase-config"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔒 Setting up Firebase configuration in Google Secret Manager${NC}"

# Check if application default credentials are set
if ! gcloud auth application-default print-access-token >/dev/null 2>&1; then
    echo -e "${YELLOW}🔐 Setting up application default credentials...${NC}"
    gcloud auth application-default login --no-launch-browser
    echo -e "${YELLOW}📋 Please copy the URL above and paste it into your browser to authenticate${NC}"
    echo -e "${YELLOW}💡 This will set up credentials that can be used by applications${NC}"
fi

# Set project
echo -e "${YELLOW}📝 Setting project to $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Create the secret if it doesn't exist
if ! gcloud secrets describe "$SECRET_NAME" >/dev/null 2>&1; then
    echo -e "${YELLOW}🔑 Creating new secret: $SECRET_NAME${NC}"
    gcloud secrets create "$SECRET_NAME" \
        --replication-policy="automatic" \
        --labels="environment=production,hipaa-compliant=true,service=firebase"
fi

# Create a temporary file for the configuration
TEMP_FILE=$(mktemp)
cat > "$TEMP_FILE" << EOF
{
    "projectId": "luknerlumina-firebase",
    "apiKey": "AIzaSyCIMBYxl3lMAPMAWOKzLjwItD_k-5Qbd-c",
    "authDomain": "luknerlumina-firebase.firebaseapp.com",
    "storageBucket": "luknerlumina-firebase.firebasestorage.app",
    "messagingSenderId": "623450773640",
    "appId": "1:623450773640:web:9afd63d3ccbb1fcb6fe73d"
}
EOF

# Add the new version to the secret
echo -e "${YELLOW}📤 Adding new version to secret...${NC}"
gcloud secrets versions add "$SECRET_NAME" --data-file="$TEMP_FILE"

# Clean up
rm "$TEMP_FILE"

# Set up IAM permissions for Firebase service account
echo -e "${YELLOW}🔐 Setting up IAM permissions...${NC}"
gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
    --member="serviceAccount:$PROJECT_ID@appspot.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

echo -e "${GREEN}✅ Firebase configuration stored securely in Secret Manager!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Update your application to use Secret Manager"
echo "2. Remove Firebase config from .env files"
echo "3. Update deployment scripts to use Secret Manager"
echo "4. Configure monitoring for secret access" 