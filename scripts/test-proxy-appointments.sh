#!/bin/bash

# Test script for Tebra Proxy Appointments Endpoint
# Run this with: ./test-proxy-appointments.sh [PROXY_URL] [API_KEY]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PROXY_URL=${1:-"https://your-proxy-url.run.app"}
API_KEY=${2:-"your-api-key"}

if [ "$PROXY_URL" = "https://your-proxy-url.run.app" ] || [ "$API_KEY" = "your-api-key" ]; then
    echo -e "${RED}❌ Please provide proxy URL and API key:${NC}"
    echo "Usage: $0 <PROXY_URL> <API_KEY>"
    echo "Example: $0 https://tebra-proxy-abc123-uc.a.run.app your-secure-api-key"
    exit 1
fi

echo -e "${YELLOW}🧪 Testing Tebra Proxy with Lukner Medical Clinic settings...${NC}"
echo "Proxy URL: $PROXY_URL"
echo "API Key: ${API_KEY:0:8}..."

# Test 1: Health check
echo -e "\n${YELLOW}1. Testing health endpoint...${NC}"
curl -s -H "X-API-Key: $API_KEY" "$PROXY_URL/health" | jq . || echo -e "${RED}❌ Health check failed${NC}"

# Test 2: Get practices (to verify practice info)
echo -e "\n${YELLOW}2. Getting practices...${NC}"
curl -s -H "X-API-Key: $API_KEY" "$PROXY_URL/practices" | jq . || echo -e "${RED}❌ Failed to get practices${NC}"

# Test 3: Get providers 
echo -e "\n${YELLOW}3. Getting providers...${NC}"
curl -s -H "X-API-Key: $API_KEY" "$PROXY_URL/providers" | jq . || echo -e "${RED}❌ Failed to get providers${NC}"

# Test 4: Get appointments for today
echo -e "\n${YELLOW}4. Getting appointments for today...${NC}"
TODAY=$(date +%Y-%m-%d)
curl -s -X POST \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"fromDate\":\"$TODAY\",\"toDate\":\"$TODAY\"}" \
  "$PROXY_URL/appointments" | jq . || echo -e "${RED}❌ Failed to get appointments${NC}"

# Test 5: Get appointments for a broader range
echo -e "\n${YELLOW}5. Getting appointments for broader date range...${NC}"
WEEK_AGO=$(date -d '7 days ago' +%Y-%m-%d 2>/dev/null || date -v-7d +%Y-%m-%d)
WEEK_AHEAD=$(date -d '7 days' +%Y-%m-%d 2>/dev/null || date -v+7d +%Y-%m-%d)
curl -s -X POST \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"fromDate\":\"$WEEK_AGO\",\"toDate\":\"$WEEK_AHEAD\"}" \
  "$PROXY_URL/appointments" | jq . || echo -e "${RED}❌ Failed to get appointments for date range${NC}"

echo -e "\n${GREEN}✅ Testing completed!${NC}"
echo -e "${YELLOW}Note: If appointments array is empty, it could mean:${NC}"
echo "- No appointments scheduled for the tested dates"
echo "- Practice ID 67149 or practice name 'Lukner Medical Clinic' needs verification"
echo "- Timezone settings need adjustment"