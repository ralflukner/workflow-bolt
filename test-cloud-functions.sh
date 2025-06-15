#!/bin/bash

# Test script for Cloud Functions

echo "Testing getSecret function..."

# Get the Cloud Run URL for the function
FUNCTION_URL=$(gcloud functions describe getSecret --region=us-central1 --gen2 --format="value(serviceConfig.uri)")

echo "Function URL: $FUNCTION_URL"

# Test with curl - note that this will fail without proper authentication
echo -e "\nTesting without authentication (should fail):"
curl -X POST $FUNCTION_URL \
  -H "Content-Type: application/json" \
  -d '{"data":{"secretKey":"TEBRA_PROXY_API_KEY"}}'

echo -e "\n\nTo properly test authenticated functions, you need to:"
echo "1. Use Firebase SDK from a client app with authentication"
echo "2. Or use Firebase Admin SDK from a backend service"
echo "3. Or temporarily disable authentication for testing"

echo -e "\n\nTesting tebraTestConnection (if it doesn't require auth):"
TEST_URL=$(gcloud functions describe tebraTestConnection --region=us-central1 --gen2 --format="value(serviceConfig.uri)")
echo "Test connection URL: $TEST_URL"

# This might work if tebraTestConnection doesn't require auth
curl -X POST $TEST_URL \
  -H "Content-Type: application/json" \
  -d '{}'