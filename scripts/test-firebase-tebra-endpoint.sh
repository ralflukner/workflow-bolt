#!/bin/bash
# Test Firebase Tebra Endpoint Script
# This script tests the Firebase Functions Tebra endpoints

set -e

echo "🔥 Firebase Tebra Endpoint Test"
echo "==============================="
echo ""

# Set the Firebase project ID
PROJECT_ID="luknerlumina-firebase"

echo "📌 Project ID: $PROJECT_ID"
echo ""

# Generate a custom token using the Node.js script
echo "🔑 Generating Firebase custom token..."
CUSTOM_TOKEN=$(node scripts/get-firebase-token.js 2>&1 | grep -A1 "Firebase Custom Token Generated:" | tail -n1)

if [ -z "$CUSTOM_TOKEN" ]; then
    echo "❌ Failed to generate custom token"
    exit 1
fi

echo "✅ Custom token generated"
echo ""

# Exchange custom token for ID token
echo "🔄 Exchanging custom token for ID token..."
API_KEY=$(grep VITE_FIREBASE_API_KEY .env | cut -d'=' -f2)

if [ -z "$API_KEY" ]; then
    echo "❌ Could not find Firebase API key in .env"
    exit 1
fi

# Exchange custom token for ID token
EXCHANGE_RESPONSE=$(curl -s -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=$API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$CUSTOM_TOKEN\",\"returnSecureToken\":true}")

ID_TOKEN=$(echo "$EXCHANGE_RESPONSE" | grep -o '"idToken":[[:space:]]*"[^"]*"' | sed 's/.*"idToken":[[:space:]]*"\([^"]*\)".*/\1/')

if [ -z "$ID_TOKEN" ]; then
    echo "❌ Failed to exchange custom token for ID token"
    echo "Response: $EXCHANGE_RESPONSE"
    exit 1
fi

echo "✅ ID token obtained"
echo ""

# Test getTebra endpoint (sync appointments)
echo "🏥 Testing getTebra endpoint..."
echo "--------------------------------"

# Get today's date
TODAY=$(date +%Y-%m-%d)
echo "📅 Testing with date: $TODAY"
echo ""

# Call the getTebra function
TEBRA_RESPONSE=$(curl -s -X POST \
  "https://us-central1-$PROJECT_ID.cloudfunctions.net/getTebra" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"date\":\"$TODAY\",\"debug\":true}")

echo "Response:"
echo "$TEBRA_RESPONSE" | jq . || echo "$TEBRA_RESPONSE"
echo ""

# Test getTebraProviders endpoint
echo "👨‍⚕️ Testing getTebraProviders endpoint..."
echo "--------------------------------------"

PROVIDERS_RESPONSE=$(curl -s -X POST \
  "https://us-central1-$PROJECT_ID.cloudfunctions.net/getTebraProviders" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}")

echo "Response:"
echo "$PROVIDERS_RESPONSE" | jq . || echo "$PROVIDERS_RESPONSE"
echo ""

# Test getPatientByPhone endpoint
echo "📱 Testing getPatientByPhone endpoint..."
echo "--------------------------------------"

PATIENT_RESPONSE=$(curl -s -X POST \
  "https://us-central1-$PROJECT_ID.cloudfunctions.net/getPatientByPhone" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"5551234567\"}")

echo "Response:"
echo "$PATIENT_RESPONSE" | jq . || echo "$PATIENT_RESPONSE"
echo ""

echo "✅ Firebase Tebra endpoint tests completed"
echo ""
echo "📝 Summary:"
echo "- getTebra: Check if appointments are returned"
echo "- getTebraProviders: Check if providers list is returned"
echo "- getPatientByPhone: Check if patient search works"
echo ""
echo "🔍 If you see errors, check:"
echo "1. Firebase Functions logs: firebase functions:log"
echo "2. Tebra credentials in Secret Manager"
echo "3. PHP API service is running on Cloud Run"