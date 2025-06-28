#!/bin/bash

# Check deployment status of Tebra PHP API

echo "🔍 Checking Tebra PHP API deployment status..."
echo ""

# Get service details
SERVICE_URL=$(gcloud run services describe tebra-php-api --region us-central1 --format="get(status.url)" 2>/dev/null)
LATEST_REVISION=$(gcloud run services describe tebra-php-api --region us-central1 --format="get(status.latestReadyRevisionName)" 2>/dev/null)
TRAFFIC=$(gcloud run services describe tebra-php-api --region us-central1 --format="get(status.traffic[0].percent)" 2>/dev/null)

echo "📋 Service Details:"
echo "  URL: $SERVICE_URL"
echo "  Latest Revision: $LATEST_REVISION"
echo "  Traffic: ${TRAFFIC}%"
echo ""

# Test endpoints
echo "🧪 Testing endpoints..."

# Health check
echo -n "  Health Check: "
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL/health)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ OK ($HEALTH_STATUS)"
else
    echo "❌ Failed ($HEALTH_STATUS)"
fi

# API health
echo -n "  API Health: "
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL/api/health)
if [ "$API_STATUS" = "200" ]; then
    echo "✅ OK ($API_STATUS)"
else
    echo "❌ Failed ($API_STATUS)"
fi

# Test connection (without auth)
echo -n "  Test Connection: "
TEST_RESPONSE=$(curl -s -X POST $SERVICE_URL/api/testConnection)
if echo "$TEST_RESPONSE" | grep -q '"success":true'; then
    echo "✅ OK (Connected to Tebra)"
else
    echo "⚠️  Check response"
fi

echo ""
echo "📊 Recent logs (last 5 entries):"
gcloud run services logs read tebra-php-api --region us-central1 --limit 5 --format="table(timestamp,severity,textPayload)" 2>/dev/null

echo ""
echo "✅ Deployment check complete!"
echo ""
echo "📝 To update Firestore config, run:"
echo "  cd .. && node scripts/update-firestore-config.js"