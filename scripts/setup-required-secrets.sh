#!/bin/bash

# Required Secrets Setup Script for Google Secret Manager
# HIPAA-Compliant Configuration Management

set -e

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"luknerlumina-firebase"}
SECRETS=(
  "tebra-proxy-api-key:VITE_TEBRA_PROXY_API_KEY"
  "firebase-config:FIREBASE_CONFIG"
  "GOOGLE_CLOUD_PROJECT:GOOGLE_CLOUD_PROJECT"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔒 Setting up required secrets in Google Secret Manager${NC}"

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

# Create a temporary file for the configuration
TEMP_FILE=$(mktemp)

# Process each secret
for SECRET_INFO in "${SECRETS[@]}"; do
    # Split the secret info into name and env var
    SECRET_NAME=$(echo $SECRET_INFO | cut -d':' -f1)
    ENV_VAR=$(echo $SECRET_INFO | cut -d':' -f2)
    
    echo -e "${YELLOW}🔑 Processing secret: $SECRET_NAME${NC}"
    
    # Create the secret if it doesn't exist
    if ! gcloud secrets describe "$SECRET_NAME" >/dev/null 2>&1; then
        echo -e "${YELLOW}🔑 Creating new secret: $SECRET_NAME${NC}"
        gcloud secrets create "$SECRET_NAME" \
            --replication-policy="user-managed" \
            --locations="us-central1,us-east1" \
            --labels="environment=production,hipaa-compliant=true,service=workflow-bolt"
    fi
    
    # Get the secret value from environment variable
    SECRET_VALUE=${!ENV_VAR}
    if [ -z "$SECRET_VALUE" ]; then
        echo -e "${RED}❌ $ENV_VAR environment variable not set${NC}"
        echo -e "${YELLOW}Please set $ENV_VAR with the appropriate value${NC}"
        continue
    fi
    
    # Write the secret value to the temporary file
    echo "$SECRET_VALUE" > "$TEMP_FILE"
    
    # Add the new version to the secret
    echo -e "${YELLOW}📤 Adding new version to secret: $SECRET_NAME${NC}"
    gcloud secrets versions add "$SECRET_NAME" --data-file="$TEMP_FILE"
    
    # Set up IAM permissions for service account
    echo -e "${YELLOW}🔐 Setting up IAM permissions for $SECRET_NAME...${NC}"
    gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
        --member="serviceAccount:$PROJECT_ID@appspot.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor"
        
    echo -e "${GREEN}✅ Secret $SECRET_NAME stored securely in Secret Manager!${NC}"
done

# Clean up
rm "$TEMP_FILE"

echo -e "${GREEN}✅ All required secrets stored securely in Secret Manager!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Update your application to use Secret Manager"
echo "2. Remove sensitive values from .env files"
echo "3. Update deployment scripts to use Secret Manager"
echo "4. Configure monitoring for secret access"

# Special instructions for FIREBASE_CONFIG
echo -e "${YELLOW}📝 For FIREBASE_CONFIG:${NC}"
echo "If you need to create a Firebase config JSON from individual environment variables, use:"
echo "export FIREBASE_CONFIG='{\"apiKey\":\"$VITE_FIREBASE_API_KEY\",\"authDomain\":\"$VITE_FIREBASE_AUTH_DOMAIN\",\"projectId\":\"$VITE_FIREBASE_PROJECT_ID\",\"storageBucket\":\"$VITE_FIREBASE_STORAGE_BUCKET\",\"messagingSenderId\":\"$VITE_FIREBASE_MESSAGING_SENDER_ID\",\"appId\":\"$VITE_FIREBASE_APP_ID\"}'"