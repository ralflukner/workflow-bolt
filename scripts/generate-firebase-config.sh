#!/bin/bash

# Generate Firebase Config Script
# Creates a JSON string for FIREBASE_CONFIG from individual environment variables

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Generating Firebase Config JSON${NC}"

# Source .env.local if it exists
if [ -f .env.local ]; then
    echo -e "${YELLOW}📝 Loading environment variables from .env.local${NC}"
    source .env.local
fi

# Check if required variables are set
REQUIRED_VARS=(
    "VITE_FIREBASE_API_KEY"
    "VITE_FIREBASE_AUTH_DOMAIN"
    "VITE_FIREBASE_PROJECT_ID"
    "VITE_FIREBASE_STORAGE_BUCKET"
    "VITE_FIREBASE_MESSAGING_SENDER_ID"
    "VITE_FIREBASE_APP_ID"
)

MISSING_VARS=0
for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        echo -e "${RED}❌ $VAR is not set${NC}"
        MISSING_VARS=1
    fi
done

if [ $MISSING_VARS -eq 1 ]; then
    echo -e "${RED}❌ Some required variables are missing. Please set them in .env.local or as environment variables.${NC}"
    exit 1
fi

# Generate the Firebase config JSON
FIREBASE_CONFIG="{
  \"apiKey\": \"$VITE_FIREBASE_API_KEY\",
  \"authDomain\": \"$VITE_FIREBASE_AUTH_DOMAIN\",
  \"projectId\": \"$VITE_FIREBASE_PROJECT_ID\",
  \"storageBucket\": \"$VITE_FIREBASE_STORAGE_BUCKET\",
  \"messagingSenderId\": \"$VITE_FIREBASE_MESSAGING_SENDER_ID\",
  \"appId\": \"$VITE_FIREBASE_APP_ID\"
}"

# Print the config
echo -e "${GREEN}✅ Firebase Config JSON generated:${NC}"
echo "$FIREBASE_CONFIG"

# Export the variable
echo -e "${YELLOW}📝 To use this config, run:${NC}"
echo "export FIREBASE_CONFIG='$FIREBASE_CONFIG'"