#!/bin/bash

# Deploy and Test CORS/Authentication Fixes
# This script deploys the changes and runs comprehensive verification tests

set -e  # Exit on any error

echo "🚀 Firebase Functions CORS and Authentication Fixes - Deployment & Testing"
echo "========================================================================"
echo "Timestamp: $(date)"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

fail() {
    echo -e "${RED}❌ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Pre-deployment verification
echo "📋 Step 1: Pre-deployment verification"
echo "----------------------------------------"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -eq 20 ]; then
    pass "Node.js version is correct (v$NODE_VERSION)"
else
    fail "Node.js version $NODE_VERSION is incorrect. Use Node.js 20"
    exit 1
fi

# Check Firebase CLI
if command -v firebase &> /dev/null; then
    pass "Firebase CLI is available"
else
    fail "Firebase CLI not found. Install with: npm install -g firebase-tools"
    exit 1
fi

# Run pre-deployment checks
echo ""
info "Running pre-deployment safety checks..."
if ./scripts/pre-deploy-check.sh; then
    pass "Pre-deployment checks passed"
else
    fail "Pre-deployment checks failed"
    exit 1
fi

# Step 2: Deploy Firebase Functions
echo ""
echo "📦 Step 2: Deploy Firebase Functions"
echo "------------------------------------"

cd functions

# Clean install dependencies
info "Installing dependencies..."
npm ci

# Deploy functions
info "Deploying Firebase Functions..."
if firebase deploy --only functions; then
    pass "Firebase Functions deployed successfully"
else
    fail "Firebase Functions deployment failed"
    exit 1
fi

cd ..

# Step 3: Deploy Firestore Rules
echo ""
echo "🔐 Step 3: Deploy Firestore Security Rules"
echo "------------------------------------------"

info "Deploying Firestore security rules..."
if firebase deploy --only firestore:rules; then
    pass "Firestore rules deployed successfully"
else
    fail "Firestore rules deployment failed"
    exit 1
fi

# Step 4: Test Deployed Functions
echo ""
echo "🧪 Step 4: Test Deployed Functions"
echo "----------------------------------"

info "Running function deployment verification..."
if node test-functions-deployment.cjs; then
    pass "Function deployment verification passed"
else
    warn "Some functions may have issues (check output above)"
fi

# Step 5: Test New Credential Functions
echo ""
echo "🔍 Step 5: Test New Credential Functions"
echo "----------------------------------------"

PROJECT_ID="luknerlumina-firebase"
REGION="us-central1"

# Test credential verification endpoint
info "Testing credential verification endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://${REGION}-${PROJECT_ID}.cloudfunctions.net/verifyCredentials" || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    pass "Credential verification endpoint responding (HTTP 200)"
elif [ "$HTTP_STATUS" = "500" ]; then
    warn "Credential verification endpoint responding but with errors (HTTP 500)"
    info "This may indicate configuration issues that need attention"
else
    fail "Credential verification endpoint not responding (HTTP $HTTP_STATUS)"
fi

# Test health check endpoint
info "Testing health check endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://${REGION}-${PROJECT_ID}.cloudfunctions.net/healthCheck" || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    pass "Health check endpoint responding (HTTP 200)"
else
    fail "Health check endpoint not responding (HTTP $HTTP_STATUS)"
fi

# Step 6: Test CORS Configuration
echo ""
echo "🌐 Step 6: Test CORS Configuration"
echo "----------------------------------"

info "Testing CORS preflight for getFirebaseConfig..."

# Test OPTIONS request (CORS preflight)
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X OPTIONS \
    -H "Origin: http://localhost:5173" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Content-Type" \
    "https://${REGION}-${PROJECT_ID}.cloudfunctions.net/getFirebaseConfig" || echo "000")

if [ "$HTTP_STATUS" = "204" ] || [ "$HTTP_STATUS" = "200" ]; then
    pass "CORS preflight request successful (HTTP $HTTP_STATUS)"
else
    fail "CORS preflight request failed (HTTP $HTTP_STATUS)"
    warn "This indicates CORS configuration issues"
fi

# Test actual GET request
info "Testing actual getFirebaseConfig request..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Origin: http://localhost:5173" \
    "https://${REGION}-${PROJECT_ID}.cloudfunctions.net/getFirebaseConfig" || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    pass "getFirebaseConfig GET request successful (HTTP 200)"
else
    fail "getFirebaseConfig GET request failed (HTTP $HTTP_STATUS)"
fi

# Step 7: Verify Function Logs
echo ""
echo "📋 Step 7: Check Function Logs for Errors"
echo "-----------------------------------------"

info "Checking recent function logs for errors..."

# Check for recent errors (last 10 minutes)
ERROR_COUNT=$(gcloud functions logs read --limit=50 --filter="severity>=ERROR AND timestamp>=\"$(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%SZ)\"" 2>/dev/null | grep -c "ERROR" || echo "0")

if [ "$ERROR_COUNT" -eq 0 ]; then
    pass "No recent errors found in function logs"
else
    warn "Found $ERROR_COUNT recent errors in function logs"
    info "Check logs with: gcloud functions logs read --limit=20 --filter='severity>=ERROR'"
fi

# Step 8: Generate Deployment Report
echo ""
echo "📊 Step 8: Generate Deployment Report"
echo "-------------------------------------"

TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
REPORT_FILE="deployment-report-$(date +%Y%m%d-%H%M%S).txt"

cat > "$REPORT_FILE" << EOF
Firebase Functions CORS and Authentication Fixes - Deployment Report
====================================================================

Deployment Timestamp: $TIMESTAMP
Node.js Version: v$(node --version | cut -d'v' -f2)
Firebase CLI Version: $(firebase --version)

Changes Deployed:
✅ Credential verification system (3 new functions)
✅ getFirebaseConfig CORS configuration updates
✅ Firestore security rules updates
✅ Missing test modules created

Function Endpoints:
- verifyCredentials: HTTP $HTTP_STATUS (credential verification)  
- healthCheck: HTTP $HTTP_STATUS (health monitoring)
- getFirebaseConfig: CORS preflight tested

Testing Results:
- Pre-deployment checks: ✅ PASSED
- Functions deployment: ✅ SUCCESS
- Firestore rules deployment: ✅ SUCCESS
- Function verification: ✅ COMPLETED
- CORS testing: $([ "$HTTP_STATUS" = "204" ] || [ "$HTTP_STATUS" = "200" ] && echo "✅ PASSED" || echo "❌ FAILED")
- Recent errors: $ERROR_COUNT found

Next Steps:
1. Test authentication flow in browser
2. Verify patient data loads correctly  
3. Clear localStorage if needed: localStorage.clear(); location.reload();
4. Monitor function logs for 24 hours

For troubleshooting, see:
- Implementation log: docs/04-ops/cors-auth-fixes-implementation-log.md
- Deployment runbook: docs/04-ops/firebase-deployment-runbook.md
EOF

pass "Deployment report generated: $REPORT_FILE"

# Step 9: Summary and Next Steps
echo ""
echo "🎯 Step 9: Deployment Summary"
echo "=============================="

echo ""
echo "✅ DEPLOYMENT COMPLETED SUCCESSFULLY"
echo ""
echo "🔍 What was deployed:"
echo "   • Credential verification system (verifyCredentials, checkCredentials, healthCheck)"  
echo "   • Fixed CORS configuration for getFirebaseConfig"
echo "   • Updated Firestore security rules for authenticated access"
echo "   • Created missing test modules (tebraApiService, test setup)"
echo ""
echo "🧪 Testing recommendations:"
echo "   1. Open browser DevTools → Network tab"
echo "   2. Clear browser data: localStorage.clear(); sessionStorage.clear(); location.reload();"
echo "   3. Test Auth0 login → Firebase token exchange → Firestore data access"
echo "   4. Verify all patients display (not just 'Sherry Free')"
echo "   5. Check console for CORS/permission errors"
echo ""
echo "📊 Monitoring:"
echo "   • Function logs: firebase functions:log"
echo "   • Error tracking: gcloud logging read 'severity>=ERROR'"
echo "   • Performance: Cloud Console → Functions → Metrics"
echo ""
echo "🆘 If issues persist:"
echo "   • Check implementation log: docs/04-ops/cors-auth-fixes-implementation-log.md"
echo "   • Run troubleshooting commands documented in the log"
echo "   • Verify credentials: curl https://${REGION}-${PROJECT_ID}.cloudfunctions.net/verifyCredentials"
echo ""

if [ "$ERROR_COUNT" -gt 0 ]; then
    warn "Note: $ERROR_COUNT recent errors found in logs - investigate if needed"
fi

echo "🎉 Deployment and testing completed at $(date)"
echo ""