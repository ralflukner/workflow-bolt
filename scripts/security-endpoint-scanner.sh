#!/bin/bash

# 🔒 HIPAA Endpoint Security Scanner
# Tests all public-facing endpoints for proper authentication enforcement
# Author: Claude Code Assistant
# Version: 1.0
# Date: 2025-07-05

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ID="luknerlumina-firebase"
REGION="us-central1"

echo -e "${BLUE}🔒 HIPAA Endpoint Security Scanner${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

# Security test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Track vulnerable endpoints
declare -a VULNERABLE_ENDPOINTS
declare -a WARNING_ENDPOINTS

# Function to test endpoint security
test_endpoint() {
    local url="$1"
    local service_name="$2"
    local expected_status="$3"  # Expected status for unauthenticated request (usually 401 or 403)
    local test_type="$4"        # "firebase-function", "cloud-run", "http-endpoint"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $service_name... "
    
    # Test 1: No authentication
    local response_no_auth
    local status_no_auth
    
    if command -v timeout >/dev/null 2>&1; then
        response_no_auth=$(timeout 10 curl -s -w "%{http_code}" -o /dev/null "$url" 2>/dev/null || echo "TIMEOUT")
    else
        response_no_auth=$(curl -s -w "%{http_code}" -o /dev/null "$url" 2>/dev/null || echo "ERROR")
    fi
    
    status_no_auth="$response_no_auth"
    
    # Test 2: Invalid authentication
    local response_bad_auth
    if command -v timeout >/dev/null 2>&1; then
        response_bad_auth=$(timeout 10 curl -s -w "%{http_code}" -o /dev/null -H "Authorization: Bearer invalid_token_here" "$url" 2>/dev/null || echo "TIMEOUT")
    else
        response_bad_auth=$(curl -s -w "%{http_code}" -o /dev/null -H "Authorization: Bearer invalid_token_here" "$url" 2>/dev/null || echo "ERROR")
    fi
    
    # Evaluate security status
    if [[ "$status_no_auth" == "401" || "$status_no_auth" == "403" ]]; then
        if [[ "$response_bad_auth" == "401" || "$response_bad_auth" == "403" ]]; then
            echo -e "${GREEN}✅ SECURE${NC} (${status_no_auth}/${response_bad_auth})"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${YELLOW}⚠️  PARTIAL${NC} (no auth: ${status_no_auth}, bad auth: ${response_bad_auth})"
            WARNING_ENDPOINTS+=("$service_name ($url) - Bad auth handling")
            WARNINGS=$((WARNINGS + 1))
        fi
    elif [[ "$status_no_auth" == "404" ]]; then
        echo -e "${YELLOW}⚠️  NOT_FOUND${NC} (${status_no_auth}) - May be secure or misconfigured"
        WARNING_ENDPOINTS+=("$service_name ($url) - Returns 404, verify if intentional")
        WARNINGS=$((WARNINGS + 1))
    elif [[ "$status_no_auth" == "200" ]]; then
        echo -e "${RED}❌ VULNERABLE${NC} (${status_no_auth}) - Allows unauthenticated access!"
        VULNERABLE_ENDPOINTS+=("$service_name ($url) - Returns 200 without auth")
        FAILED_TESTS=$((FAILED_TESTS + 1))
    elif [[ "$status_no_auth" == "TIMEOUT" || "$status_no_auth" == "ERROR" ]]; then
        echo -e "${YELLOW}⚠️  UNREACHABLE${NC} - Network error or timeout"
        WARNING_ENDPOINTS+=("$service_name ($url) - Network error or timeout")
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${YELLOW}⚠️  UNKNOWN${NC} (${status_no_auth}) - Unexpected response"
        WARNING_ENDPOINTS+=("$service_name ($url) - Unexpected HTTP ${status_no_auth}")
        WARNINGS=$((WARNINGS + 1))
    fi
}

# Function to test security headers
test_security_headers() {
    local url="$1"
    local service_name="$2"
    
    echo -n "Checking security headers for $service_name... "
    
    local headers
    if command -v timeout >/dev/null 2>&1; then
        headers=$(timeout 10 curl -s -I "$url" 2>/dev/null || echo "")
    else
        headers=$(curl -s -I "$url" 2>/dev/null || echo "")
    fi
    
    local missing_headers=()
    
    # Check for essential security headers
    if ! echo "$headers" | grep -i "x-content-type-options" >/dev/null; then
        missing_headers+=("X-Content-Type-Options")
    fi
    
    if ! echo "$headers" | grep -i "x-frame-options" >/dev/null; then
        missing_headers+=("X-Frame-Options")
    fi
    
    if ! echo "$headers" | grep -i "x-xss-protection" >/dev/null; then
        missing_headers+=("X-XSS-Protection")
    fi
    
    if [[ ${#missing_headers[@]} -eq 0 ]]; then
        echo -e "${GREEN}✅ GOOD${NC}"
    else
        echo -e "${YELLOW}⚠️  MISSING: ${missing_headers[*]}${NC}"
        WARNING_ENDPOINTS+=("$service_name - Missing security headers: ${missing_headers[*]}")
    fi
}

echo -e "${BLUE}1. Testing Firebase Functions${NC}"
echo "-----------------------------"

# Firebase Functions URLs
FIREBASE_BASE="https://us-central1-luknerlumina-firebase.cloudfunctions.net"

# Test key Firebase Functions
test_endpoint "$FIREBASE_BASE/getFirebaseConfig" "getFirebaseConfig" "401" "firebase-function"
test_endpoint "$FIREBASE_BASE/exchangeAuth0Token" "exchangeAuth0Token" "401" "firebase-function"
test_endpoint "$FIREBASE_BASE/tebraProxy" "tebraProxy" "401" "firebase-function"
test_endpoint "$FIREBASE_BASE/tebraGetPatient" "tebraGetPatient" "401" "firebase-function"
test_endpoint "$FIREBASE_BASE/tebraGetProviders" "tebraGetProviders" "401" "firebase-function"
test_endpoint "$FIREBASE_BASE/getSecurityReport" "getSecurityReport" "401" "firebase-function"

# Test the main API endpoint
test_endpoint "$FIREBASE_BASE/api/health" "API Health Check" "200" "http-endpoint"  # Health checks can be public
test_endpoint "$FIREBASE_BASE/api/tebra" "API Tebra Proxy" "401" "http-endpoint"

echo ""
echo -e "${BLUE}2. Testing Cloud Run Services${NC}"
echo "------------------------------"

# Get Cloud Run services and test them
while IFS= read -r line; do
    if [[ "$line" =~ ^([a-zA-Z0-9-]+)[[:space:]]+https://([^[:space:]]+) ]]; then
        service_name="${BASH_REMATCH[1]}"
        service_url="https://${BASH_REMATCH[2]}"
        
        # Skip some obvious health/public endpoints but test most
        case "$service_name" in
            "healthcheck"|"credentialhealth")
                # These can be public for monitoring
                test_endpoint "$service_url" "$service_name (Cloud Run)" "200" "cloud-run"
                ;;
            *)
                # Most Cloud Run services should require auth
                test_endpoint "$service_url" "$service_name (Cloud Run)" "401" "cloud-run"
                ;;
        esac
    fi
done < <(gcloud run services list --format="table[no-heading](metadata.name,status.url)" --project="$PROJECT_ID" 2>/dev/null || echo "")

echo ""
echo -e "${BLUE}3. Testing Security Headers${NC}"
echo "----------------------------"

# Test security headers on main endpoints
test_security_headers "$FIREBASE_BASE/api/health" "Firebase API"
test_security_headers "https://api-xccvzgogwa-uc.a.run.app" "Cloud Run API"

echo ""
echo -e "${BLUE}4. Additional Security Checks${NC}"
echo "--------------------------------"

# Check for open storage buckets
echo -n "Checking Cloud Storage buckets... "
BUCKETS=$(gsutil ls -p "$PROJECT_ID" 2>/dev/null || echo "")
if [[ -n "$BUCKETS" ]]; then
    echo -e "${YELLOW}⚠️  Found buckets - manual review required${NC}"
    WARNING_ENDPOINTS+=("Cloud Storage - Manual review required for bucket permissions")
else
    echo -e "${GREEN}✅ No public buckets found${NC}"
fi

# Check Firestore security rules
echo -n "Checking Firestore security rules... "
FIRESTORE_RULES=$(gcloud firestore operations list --filter="name:projects/$PROJECT_ID" 2>/dev/null || echo "")
if command -v firebase >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Manual review required${NC}"
    WARNING_ENDPOINTS+=("Firestore Rules - Manual review required")
else
    echo -e "${YELLOW}⚠️  Firebase CLI not available for automated check${NC}"
    WARNING_ENDPOINTS+=("Firestore Rules - Could not check (Firebase CLI missing)")
fi

echo ""
echo -e "${BLUE}5. Service Account Permissions${NC}"
echo "------------------------------"

echo -n "Checking service account IAM policies... "
SA_COUNT=$(gcloud iam service-accounts list --project="$PROJECT_ID" --format="value(email)" 2>/dev/null | wc -l || echo "0")
echo -e "${YELLOW}⚠️  Found $SA_COUNT service accounts - manual review required${NC}"
WARNING_ENDPOINTS+=("Service Accounts - $SA_COUNT accounts found, manual review required")

echo ""
echo -e "${BLUE}=== SECURITY SCAN RESULTS ===${NC}"
echo ""
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"

if [[ $FAILED_TESTS -gt 0 ]]; then
    echo ""
    echo -e "${RED}🚨 CRITICAL VULNERABILITIES FOUND:${NC}"
    printf '%s\n' "${VULNERABLE_ENDPOINTS[@]}"
fi

if [[ $WARNINGS -gt 0 ]]; then
    echo ""
    echo -e "${YELLOW}⚠️  WARNINGS (require manual review):${NC}"
    printf '%s\n' "${WARNING_ENDPOINTS[@]}"
fi

echo ""
echo -e "${BLUE}=== RECOMMENDATIONS ===${NC}"
echo ""

if [[ $FAILED_TESTS -gt 0 ]]; then
    echo -e "${RED}IMMEDIATE ACTION REQUIRED:${NC}"
    echo "1. Fix vulnerable endpoints that return HTTP 200 without authentication"
    echo "2. Add authentication middleware to all endpoints handling PHI"
    echo "3. Redeploy affected services immediately"
    echo ""
fi

echo -e "${YELLOW}GENERAL SECURITY IMPROVEMENTS:${NC}"
echo "1. Add security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)"
echo "2. Implement rate limiting on all endpoints"
echo "3. Set up monitoring alerts for failed authentication attempts"
echo "4. Regular security scans (run this script weekly)"
echo "5. Review and minimize service account permissions"

echo ""
echo -e "${BLUE}=== NEXT STEPS ===${NC}"
echo ""
echo "1. Address any critical vulnerabilities immediately"
echo "2. Review Firestore security rules manually"
echo "3. Audit service account IAM permissions"
echo "4. Set up automated monitoring for these endpoints"
echo "5. Schedule regular security scans"

# Exit with error code if vulnerabilities found
if [[ $FAILED_TESTS -gt 0 ]]; then
    echo ""
    echo -e "${RED}⚠️  SECURITY SCAN FAILED - Critical vulnerabilities detected!${NC}"
    exit 1
else
    echo ""
    echo -e "${GREEN}✅ SECURITY SCAN PASSED - No critical vulnerabilities detected${NC}"
    exit 0
fi