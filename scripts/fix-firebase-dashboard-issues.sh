#!/opt/homebrew/bin/bash
# scripts/fix-firebase-dashboard-issues.sh
# Fix Firebase environment variables and CORS issues

echo "🔧 Fixing Firebase Dashboard Issues"
echo "==================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}1️⃣  Verifying Firebase Environment Variables${NC}"
echo "----------------------------------------------"

# Check if Firebase variables are in .env
firebase_vars=(
    "VITE_FIREBASE_PROJECT_ID"
    "VITE_FIREBASE_API_KEY"
    "VITE_FIREBASE_AUTH_DOMAIN"
    "VITE_FIREBASE_STORAGE_BUCKET"
    "VITE_FIREBASE_MESSAGING_SENDER_ID"
    "VITE_FIREBASE_APP_ID"
)

all_present=true
for var in "${firebase_vars[@]}"; do
    if grep -q "^${var}=" .env; then
        echo -e "${GREEN}✅ $var is present${NC}"
    else
        echo -e "❌ $var is missing"
        all_present=false
    fi
done

if ! $all_present; then
    echo -e "${YELLOW}⚠️  Some Firebase variables are missing. Run: ./scripts/sync-firebase-secrets.sh${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}2️⃣  Checking Firebase Functions CORS Configuration${NC}"
echo "--------------------------------------------------"

# Check if localhost:5173 is in allowed origins
if grep -q "http://localhost:5173" functions/index.js; then
    echo -e "${GREEN}✅ localhost:5173 is in CORS allowed origins${NC}"
else
    echo -e "${YELLOW}⚠️  localhost:5173 might not be in CORS allowed origins${NC}"
fi

echo ""
echo -e "${BLUE}3️⃣  Updating Firebase Functions CORS${NC}"
echo "------------------------------------"

# Create a patch to ensure proper CORS configuration
cat > /tmp/firebase-cors-patch.js << 'EOF'
// Temporary patch to check CORS configuration
const fs = require('fs');

// Read the functions index.js
const indexPath = './functions/index.js';
const content = fs.readFileSync(indexPath, 'utf8');

// Check if tebraProxy has proper CORS config
if (content.includes('exports.tebraProxy = onCall({ cors: true }')) {
    console.log('✅ tebraProxy has CORS enabled');
    
    // Also check if we need to add specific origins
    if (!content.includes('cors: ["http://localhost:5173"')) {
        console.log('⚠️  Consider adding specific CORS origins if needed');
    }
} else {
    console.log('❌ tebraProxy might not have proper CORS configuration');
}
EOF

node /tmp/firebase-cors-patch.js
rm -f /tmp/firebase-cors-patch.js

echo ""
echo -e "${BLUE}4️⃣  Instructions to Fix the Issues${NC}"
echo "---------------------------------"

echo -e "${YELLOW}To fix the environment variables issue:${NC}"
echo "1. Stop your dev server (Ctrl+C)"
echo "2. Clear your browser cache:"
echo "   - Open browser DevTools (F12)"
echo "   - Go to Application/Storage tab"
echo "   - Click 'Clear site data'"
echo "   - OR run in console: localStorage.clear(); sessionStorage.clear();"
echo "3. Restart your dev server: npm run dev"
echo ""

echo -e "${YELLOW}To fix the CORS 403 errors:${NC}"
echo "1. Deploy the latest Firebase Functions:"
echo "   firebase deploy --only functions:tebraProxy"
echo "2. If CORS errors persist, check Firebase Console:"
echo "   - Go to https://console.firebase.google.com/project/luknerlumina-firebase/functions"
echo "   - Check if tebraProxy function is properly deployed"
echo "   - Check logs for any errors"
echo ""

echo -e "${BLUE}5️⃣  Quick Test Commands${NC}"
echo "----------------------"

echo "After restarting your dev server, test in browser console:"
echo ""
echo "// Check if Firebase env vars are loaded:"
echo "console.log('Firebase Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);"
echo "console.log('Firebase API Key:', import.meta.env.VITE_FIREBASE_API_KEY);"
echo ""
echo "// Test Firebase Functions (after login):"
echo "const { getFunctions, httpsCallable } = await import('firebase/functions');"
echo "const functions = getFunctions();"
echo "const tebraProxy = httpsCallable(functions, 'tebraProxy');"
echo "const result = await tebraProxy({ action: 'healthCheck' });"
echo "console.log('Health check result:', result.data);"

echo ""
echo -e "${GREEN}✅ Script complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Restart your dev server"
echo "2. Clear browser cache"
echo "3. The Firebase environment variables warning should disappear"
echo "4. If CORS errors persist, redeploy the tebraProxy function" 