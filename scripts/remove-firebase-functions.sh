#!/bin/bash

# Script to remove Firebase Functions and clean up Firebase resources
# This is part of the migration to Redis Memorystore and PostgreSQL

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Firebase Removal Script ===${NC}"
echo -e "${YELLOW}This script will remove Firebase Functions and clean up Firebase resources${NC}"
echo ""

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Firebase CLI is not installed. Skipping Firebase cleanup.${NC}"
    exit 0
fi

# List current Firebase functions
echo -e "${YELLOW}Current Firebase Functions:${NC}"
firebase functions:list --project luknerlumina-firebase || true

# Delete Firebase functions
echo -e "${YELLOW}Deleting Firebase Functions...${NC}"
firebase functions:delete tebraProxy --force --project luknerlumina-firebase || true
firebase functions:delete dailyPurge --force --project luknerlumina-firebase || true
firebase functions:delete patientSync --force --project luknerlumina-firebase || true
firebase functions:delete tebraDebug --force --project luknerlumina-firebase || true

# Remove Firebase hosting (if using Netlify)
echo -e "${YELLOW}Removing Firebase Hosting configuration...${NC}"
firebase hosting:disable --force --project luknerlumina-firebase || true

# Clean up local Firebase files
echo -e "${YELLOW}Cleaning up local Firebase files...${NC}"
rm -f firebase.json
rm -f .firebaserc
rm -rf .firebase/
rm -rf functions/

# Remove Firebase dependencies from package.json
echo -e "${YELLOW}Removing Firebase dependencies...${NC}"
npm uninstall firebase @firebase/app @firebase/auth @firebase/firestore firebase-functions || true

# Clean up Firebase-related scripts
echo -e "${YELLOW}Removing Firebase scripts...${NC}"
rm -f scripts/firebase-auth.sh
rm -f scripts/fix-firebase-config.sh
rm -f scripts/generate-firebase-config.sh
rm -f scripts/get-firebase-config.js

# Remove Firebase configuration files
echo -e "${YELLOW}Removing Firebase configuration files...${NC}"
rm -f src/config/firebase.ts
rm -f src/config/firebase-config.ts
rm -f src/config/firebase-init.ts
rm -f src/services/firebase/firebaseConfig.ts

# Remove Firebase components
echo -e "${YELLOW}Removing Firebase components...${NC}"
rm -f src/components/FirebaseConnectionTest.tsx
rm -f src/contexts/firebase.tsx
rm -f src/hooks/useFirebase.ts
rm -f src/debug-firebase-auth.ts
rm -f src/test-firebase-connection.ts

# Remove Firebase documentation
echo -e "${YELLOW}Removing Firebase documentation...${NC}"
rm -f docs/setup/FIREBASE_SETUP.md
rm -f docs/setup/FIREBASE_CLI_AUTH.md

echo -e "${GREEN}=== Firebase Removal Complete ===${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Deploy the new GCP infrastructure: ./scripts/deploy-gcp-infrastructure.sh"
echo "2. Update environment variables to use Redis/PostgreSQL endpoints"
echo "3. Deploy the Tebra Redis Worker"
echo "4. Update frontend to use new Redis API"
echo "5. Test all functionality"
echo ""
echo -e "${RED}Important: Keep Firebase project active for 30 days as backup${NC}" 