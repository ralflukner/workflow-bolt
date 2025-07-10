#!/bin/bash

# Deploy tebraProxy Firebase Function
# This script deploys only the tebraProxy function to fix CORS 403 errors

set -e

echo "🚀 Deploying tebraProxy Firebase Function..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}Error: firebase.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Check if user is logged in to Firebase
echo -e "${BLUE}Checking Firebase authentication...${NC}"
if ! firebase projects:list > /dev/null 2>&1; then
    echo -e "${YELLOW}You need to login to Firebase first.${NC}"
    firebase login
fi

# Set the project
echo -e "${BLUE}Setting Firebase project...${NC}"
firebase use luknerlumina-firebase || {
    echo -e "${RED}Failed to set Firebase project. Make sure you have access to luknerlumina-firebase.${NC}"
    exit 1
}

# Install dependencies if needed
if [ ! -d "functions/node_modules" ]; then
    echo -e "${BLUE}Installing function dependencies...${NC}"
    cd functions
    npm ci
    cd ..
fi

# Deploy only the tebraProxy function
echo -e "${BLUE}Deploying tebraProxy function...${NC}"
firebase deploy --only functions:tebraProxy

# Check deployment status
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ tebraProxy function deployed successfully!${NC}"
    echo ""
    echo -e "${GREEN}The function is now available at:${NC}"
    echo "https://us-central1-luknerlumina-firebase.cloudfunctions.net/tebraProxy"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Clear your browser cache"
    echo "2. Refresh your application"
    echo "3. Try the 'Sync Today' button again"
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo "Please check the error messages above and try again."
    exit 1
fi

echo ""
echo -e "${BLUE}To verify the deployment, you can:${NC}"
echo "1. Go to https://console.firebase.google.com/project/luknerlumina-firebase/functions"
echo "2. Look for 'tebraProxy' in the functions list"
echo "3. Check the logs for any errors" 