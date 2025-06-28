#!/bin/bash
# Direct Tebra API Test Script
# Tests the Cloud Run PHP API directly

set -e

echo "🔍 Direct Tebra API Test"
echo "========================"
echo ""

# Get the Cloud Run service URL
echo "📡 Getting Cloud Run service URL..."
SERVICE_URL=$(gcloud run services describe tebra-php-api --region=us-central1 --format='value(status.url)' --project=luknerlumina-firebase 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
    echo "❌ Could not get Cloud Run service URL"
    echo "Using fallback URL..."
    SERVICE_URL="https://tebra-php-api-xccvzgogwa-uc.a.run.app"
fi

echo "✅ Service URL: $SERVICE_URL"
echo ""

# Test getAppointments endpoint
echo "📅 Testing getAppointments endpoint..."
echo "-------------------------------------"

# Get today's date
TODAY=$(date +%Y-%m-%d)
TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "+1 day" +%Y-%m-%d)

echo "Testing appointments for: $TODAY to $TOMORROW"
echo ""

# Call the API with debug flag
RESPONSE=$(curl -s -X GET \
  "$SERVICE_URL/api/getAppointments?fromDate=$TODAY&toDate=$TOMORROW&debug=true" \
  -H "Accept: application/json")

echo "Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if we got real data or mock data
if echo "$RESPONSE" | grep -q '"source":"real_tebra_api"'; then
    echo "✅ Got REAL data from Tebra API"
elif echo "$RESPONSE" | grep -q '"source":"hardcoded_fallback"'; then
    echo "⚠️  Got MOCK/hardcoded data (real API might be rate limited or failing)"
else
    echo "❌ Unexpected response format"
fi

echo ""

# Test getProviders endpoint
echo "👨‍⚕️ Testing getProviders endpoint..."
echo "-----------------------------------"

PROVIDERS_RESPONSE=$(curl -s -X GET \
  "$SERVICE_URL/api/getProviders" \
  -H "Accept: application/json")

echo "Response:"
echo "$PROVIDERS_RESPONSE" | jq '.GetProvidersResult.Providers[] | {ProviderId, FirstName, LastName}' 2>/dev/null || echo "Failed to parse providers"
echo ""

# Test status endpoint
echo "🔧 Testing status endpoint..."
echo "----------------------------"

STATUS_RESPONSE=$(curl -s -X GET \
  "$SERVICE_URL/api/status" \
  -H "Accept: application/json")

echo "Response:"
echo "$STATUS_RESPONSE" | jq . 2>/dev/null || echo "$STATUS_RESPONSE"
echo ""

echo "✅ Direct API tests completed"
echo ""
echo "📝 Debug Information:"
echo "- Check 'metadata' field for source (real_tebra_api vs hardcoded_fallback)"
echo "- Check 'debug_info' for detailed API call information"
echo "- Rate limit info shows when next real API call is allowed"
echo ""
echo "🔍 To check Cloud Run logs:"
echo "gcloud logging read 'resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"tebra-api\"' --limit=50 --project=luknerlumina-firebase"