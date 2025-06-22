#!/bin/bash

# Firebase CLI Authentication Script
# This script helps authenticate with Firebase CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔥 Firebase CLI Authentication Helper${NC}"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}📦 Firebase CLI not found. Installing...${NC}"
    npm install -g firebase-tools
    echo -e "${GREEN}✅ Firebase CLI installed successfully${NC}"
else
    echo -e "${GREEN}✅ Firebase CLI is already installed${NC}"
    # Check version
    FIREBASE_VERSION=$(firebase --version)
    echo -e "${YELLOW}📋 Firebase CLI version: ${FIREBASE_VERSION}${NC}"
fi

# Check if already logged in
if firebase projects:list &> /dev/null; then
    echo -e "${GREEN}✅ Already logged in to Firebase CLI${NC}"
    echo -e "${YELLOW}📋 Current Firebase projects:${NC}"
    firebase projects:list
else
    echo -e "${YELLOW}🔐 Logging in to Firebase CLI...${NC}"
    echo -e "${YELLOW}📋 A browser window will open for authentication${NC}"
    echo -e "${YELLOW}💡 If no browser opens, copy the URL that will be displayed and paste it into your browser${NC}"
    
    # Login with no-localhost option for environments without browser access
    firebase login --no-localhost
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Successfully logged in to Firebase CLI${NC}"
    else
        echo -e "${RED}❌ Failed to log in to Firebase CLI${NC}"
        exit 1
    fi
fi

# Get project ID from .env.local or prompt user
PROJECT_ID=""
if [ -f .env.local ]; then
    # Try to extract project ID from .env.local
    PROJECT_ID=$(grep VITE_FIREBASE_PROJECT_ID .env.local | cut -d '=' -f2)
fi

if [ -z "$PROJECT_ID" ]; then
    # Get project ID from environment variable
    PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-""}
fi

if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}📝 Please enter your Firebase project ID:${NC}"
    read PROJECT_ID
fi

# Set Firebase project
echo -e "${YELLOW}📝 Setting Firebase project to: ${PROJECT_ID}${NC}"
firebase use --add "$PROJECT_ID"

echo -e "${GREEN}✅ Firebase CLI authentication complete!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Deploy Firebase Functions: firebase deploy --only functions"
echo "2. Deploy Firebase Hosting: firebase deploy --only hosting"
echo "3. View Firebase Console: firebase open"