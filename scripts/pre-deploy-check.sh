#!/bin/bash

# Firebase Functions Pre-Deployment Safety Check
# Run this script before deploying to catch common issues early

set -e  # Exit on any error

echo "🔍 Firebase Functions Pre-Deployment Safety Check"
echo "================================================="
echo "Timestamp: $(date)"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Helper functions
pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((CHECKS_PASSED++))
}

fail() {
    echo -e "${RED}❌ $1${NC}"
    ((CHECKS_FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check 1: Node.js version
echo "1. Checking Node.js version..."
CURRENT_NODE=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$CURRENT_NODE" -eq 20 ]; then
    pass "Node.js version is correct (v$CURRENT_NODE)"
elif [ "$CURRENT_NODE" -eq 18 ]; then
    pass "Node.js version is supported (v$CURRENT_NODE)"
else
    fail "Node.js version $CURRENT_NODE is not supported. Use Node.js 18 or 20"
    echo "   💡 Run: nvm use 20"
fi

# Check 2: Firebase.json runtime
echo ""
echo "2. Checking firebase.json runtime configuration..."
if [ ! -f "firebase.json" ]; then
    fail "firebase.json not found"
else
# Check required tools
if ! command -v jq &> /dev/null; then
    fail "jq is required but not installed. Please install it first."
    echo "   💡 Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    exit 1
fi

if [ ! -f "firebase.json" ]; then
    fail "firebase.json not found"
else
    RUNTIME=$(jq -r '.functions.runtime // "not-found"' firebase.json 2>/dev/null || echo "parse-error")
    if [ "$RUNTIME" = "nodejs20" ] || [ "$RUNTIME" = "nodejs18" ]; then
        # …rest of your logic…
    fi
fi
        pass "Firebase runtime is correctly set to $RUNTIME"
    elif [ "$RUNTIME" = "not-found" ]; then
        warn "No runtime specified in firebase.json, will use default"
    else
        fail "Invalid runtime '$RUNTIME' in firebase.json"
        echo "   💡 Update firebase.json: \"runtime\": \"nodejs20\""
    fi
fi

# Check 3: Functions directory and package.json
echo ""
echo "3. Checking functions directory..."
if [ ! -d "functions" ]; then
    fail "functions/ directory not found"
    exit 1
else
    pass "functions/ directory exists"
fi

cd functions

if [ ! -f "package.json" ]; then
    fail "functions/package.json not found"
    exit 1
else
    pass "functions/package.json exists"
fi

# Check 4: Package.json engines
echo ""
echo "4. Checking package.json engines..."
PKG_NODE=$(jq -r '.engines.node // "not-found"' package.json 2>/dev/null || echo "parse-error")

# Function to check if a semver range includes Node.js 20
check_node_version() {
    local version_spec="$1"
    
    # Handle exact version matches
    if [[ "$version_spec" == "20" ]]; then
        return 0
    fi
    
    # Handle >= ranges (e.g., ">=20", ">=20.0.0")
    if [[ "$version_spec" =~ ^>=([0-9]+) ]]; then
        local min_version="${BASH_REMATCH[1]}"
        if [[ "$min_version" -le 20 ]]; then
            return 0
        fi
    fi
    
    # Handle ^ ranges (e.g., "^20.0.0", "^20.1.0")
    if [[ "$version_spec" =~ ^\^([0-9]+) ]]; then
        local major_version="${BASH_REMATCH[1]}"
        if [[ "$major_version" == "20" ]]; then
            return 0
        fi
    fi
    
    # Handle ~ ranges (e.g., "~20.1.0")
    if [[ "$version_spec" =~ ^~([0-9]+) ]]; then
        local major_version="${BASH_REMATCH[1]}"
        if [[ "$major_version" == "20" ]]; then
            return 0
        fi
    fi
    
    # Handle ranges with spaces (e.g., ">= 20", "^20 || ^18")
    if [[ "$version_spec" =~ (>=|>)[[:space:]]*([0-9]+) ]]; then
        local min_version="${BASH_REMATCH[2]}"
        if [[ "$min_version" -le 20 ]]; then
            return 0
        fi
    fi
    
    # Handle version ranges that include 20 (e.g., "18 || 20", "^18.0.0 || ^20.0.0")
    if [[ "$version_spec" =~ 20 ]]; then
        return 0
    fi
    
    return 1
}

if [[ "$PKG_NODE" == "not-found" ]]; then
    warn "No Node.js engine specified in package.json - recommend adding '\"node\": \"20\"'"
elif [[ "$PKG_NODE" == "parse-error" ]]; then
    fail "Error parsing package.json"
elif check_node_version "$PKG_NODE"; then
    pass "Package.json Node engine '$PKG_NODE' is compatible with Node.js 20"
else
    warn "Package.json Node engine '$PKG_NODE' may not be compatible with Node.js 20 - recommend using '20' or '>=20'"
fi

# Check 5: Dependencies installation
echo ""
echo "5. Checking dependencies..."
if [ ! -d "node_modules" ]; then
    warn "node_modules not found, installing dependencies..."
    npm ci
    pass "Dependencies installed successfully"
else
    pass "Dependencies already installed"
fi

# Check 6: Security scan for hardcoded credentials
echo ""
echo "6. Scanning for security issues..."

SECURITY_ISSUES=0

# Check for service account files
if find . -name "*service*account*.json" -o -name "*credentials*.json" | grep -q .; then
    fail "Found potential service account files:"
    find . -name "*service*account*.json" -o -name "*credentials*.json" | sed 's/^/     /'
    ((SECURITY_ISSUES++))
fi

# Check for hardcoded credentials in code
if grep -r "serviceAccount\.json\|credentials\.json" . --include="*.js" --include="*.ts" --exclude-dir=node_modules >/dev/null 2>&1; then
    fail "Found hardcoded service account references:"
    grep -r "serviceAccount\.json\|credentials\.json" . --include="*.js" --include="*.ts" --exclude-dir=node_modules | sed 's/^/     /'
    ((SECURITY_ISSUES++))
fi

# Check for exposed secrets
if grep -r -E "(api_key|apikey|secret|password|token)\s*[:=]\s*['\"][^'\"]{20,}" . --include="*.js" --include="*.ts" --exclude-dir=node_modules >/dev/null 2>&1; then
    fail "Found potential hardcoded secrets"
    ((SECURITY_ISSUES++))
fi

if [ $SECURITY_ISSUES -eq 0 ]; then
    pass "No security issues found"
fi

# Check 7: OpenTelemetry configuration
echo ""
echo "7. Checking OpenTelemetry configuration..."
if grep -r "@opentelemetry" . --include="*.js" --include="*.ts" --exclude-dir=node_modules | grep -v "if.*process\.env\|emulator\|local" >/dev/null 2>&1; then
    warn "OpenTelemetry imports found without conditional loading"
    echo "     💡 Consider lazy loading to avoid startup delays"
else
    pass "OpenTelemetry configuration looks good"
fi

# Check 8: Run tests if available
echo ""
echo "8. Running tests..."
if grep -q '"test"' package.json; then
    if npm test; then
        pass "All tests passed"
    else
        fail "Tests failed"
    fi
else
    info "No tests configured"
fi

# Check 9: Lint code if available
echo ""
echo "9. Running linter..."
if grep -q '"lint"' package.json; then
    if npm run lint; then
        pass "Linting passed"
    else
        fail "Linting failed"
    fi
else
    info "No linting configured"
fi

# Check 10: Verify main entry point
echo ""
echo "10. Checking main entry point..."
MAIN_FILE=$(jq -r '.main // "index.js"' package.json)
if [ -f "$MAIN_FILE" ]; then
    pass "Main entry point $MAIN_FILE exists"
else
    fail "Main entry point $MAIN_FILE not found"
fi

# Go back to root directory
cd ..

# Summary
echo ""
echo "📊 PRE-DEPLOYMENT CHECK SUMMARY"
echo "==============================="
echo -e "Checks passed:  ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks failed:  ${RED}$CHECKS_FAILED${NC}"
echo -e "Warnings:       ${YELLOW}$WARNINGS${NC}"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All critical checks passed! Ready for deployment.${NC}"
    echo ""
    echo "🚀 DEPLOYMENT COMMANDS:"
    echo "   cd functions && npm ci"
    echo "   firebase deploy --only functions"
    echo "   node test-functions-deployment.cjs"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}❌ $CHECKS_FAILED critical issue(s) found. Please fix before deploying.${NC}"
    echo ""
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found. Consider addressing these as well.${NC}"
    fi
    echo ""
    echo "🛠️ TROUBLESHOOTING:"
    echo "   • Check the issues listed above"
    echo "   • Ensure Node.js 20 is installed: nvm install 20 && nvm use 20"
    echo "   • Update firebase.json runtime to 'nodejs20'"
    echo "   • Remove any hardcoded credentials"
    echo "   • Run tests locally before deploying"
    echo ""
    exit 1
fi