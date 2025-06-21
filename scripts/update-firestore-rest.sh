#!/bin/bash

# Update Firestore configuration using REST API

PROJECT_ID="luknerlumina-firebase"
COLLECTION="config"
DOCUMENT="app"

echo "🔄 Updating Firestore configuration..."

# Get access token
ACCESS_TOKEN=$(gcloud auth print-access-token 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Error: Unable to get access token. Please run 'gcloud auth login' first."
    exit 1
fi

# Create/Update the document
RESPONSE=$(curl -s -X PATCH \
  "https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/${DOCUMENT}?updateMask.fieldPaths=useTebraPhpApi&updateMask.fieldPaths=tebraPhpApiUrl" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "useTebraPhpApi": {"booleanValue": true},
      "tebraPhpApiUrl": {"stringValue": "https://tebra-php-api-xccvzgogwa-uc.a.run.app/api"}
    }
  }')

# Check if the request was successful
if echo "$RESPONSE" | grep -q '"name"'; then
    echo "✅ Firestore configuration updated successfully!"
    echo ""
    echo "📋 Updated fields:"
    echo "  - useTebraPhpApi: true"
    echo "  - tebraPhpApiUrl: https://tebra-php-api-xccvzgogwa-uc.a.run.app/api"
    echo ""
    echo "🔍 To verify, visit:"
    echo "  https://console.firebase.google.com/project/${PROJECT_ID}/firestore/data/~2F${COLLECTION}~2F${DOCUMENT}"
else
    echo "❌ Error updating configuration:"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
fi