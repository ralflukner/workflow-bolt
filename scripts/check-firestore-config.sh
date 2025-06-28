#!/opt/homebrew/bin/bash

# Check Firestore configuration

PROJECT_ID="luknerlumina-firebase"
COLLECTION="config"
DOCUMENT="app"

echo "🔍 Checking Firestore configuration..."

# Get access token
ACCESS_TOKEN=$(gcloud auth print-access-token 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Error: Unable to get access token. Please run 'gcloud auth login' first."
    exit 1
fi

# Get the document
RESPONSE=$(curl -s -X GET \
  "https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/${DOCUMENT}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

# Check if the request was successful
if echo "$RESPONSE" | grep -q '"name"'; then
    echo "✅ Configuration found!"
    echo ""
    echo "📋 Current configuration:"
    
    # Extract values using jq if available, otherwise use grep
    if command -v jq &> /dev/null; then
        USE_PHP=$(echo "$RESPONSE" | jq -r '.fields.useTebraPhpApi.booleanValue // false')
        API_URL=$(echo "$RESPONSE" | jq -r '.fields.tebraPhpApiUrl.stringValue // "Not set"')
        
        echo "  - useTebraPhpApi: $USE_PHP"
        echo "  - tebraPhpApiUrl: $API_URL"
    else
        echo "$RESPONSE" | grep -E "(useTebraPhpApi|tebraPhpApiUrl)" | sed 's/.*"//g' | sed 's/".*//g'
    fi
    
    echo ""
    echo "🎉 Your app is now configured to use the PHP API!"
else
    echo "❌ Error retrieving configuration:"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
fi