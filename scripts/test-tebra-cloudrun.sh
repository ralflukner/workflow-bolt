#!/bin/bash
set -euo pipefail

# This script tests the Tebra PHP API Cloud Run service

# Set the project ID and region
PROJECT_ID="luknerlumina-firebase"
REGION="us-central1"

# Get the Cloud Run service URL
SERVICE_URL=$(gcloud run services describe tebra-php-api \
  --project=$PROJECT_ID \
  --region=$REGION \
  --format='value(status.url)')

echo "Cloud Run service URL: $SERVICE_URL"

# Get an identity token for authentication
echo "Getting identity token..."
ID_TOKEN=$(gcloud auth print-identity-token)

# Get the internal API key
# Note: This assumes you've set the INTERNAL_API_KEY environment variable
if [ -z "${INTERNAL_API_KEY:-}" ]; then
  echo "Please set the INTERNAL_API_KEY environment variable"
  echo "Example: export INTERNAL_API_KEY=your-api-key"
  exit 1
fi

# Test the health endpoint
echo "Testing health endpoint..."
curl -s -H "Authorization: Bearer $ID_TOKEN" \
     -H "Content-Type: application/json" \
     -H "X-API-Key: $INTERNAL_API_KEY" \
     -d '{"action":"health"}' \
     $SERVICE_URL | jq .

# Test the connection to Tebra API
echo "Testing Tebra API connection..."
curl -s -H "Authorization: Bearer $ID_TOKEN" \
     -H "Content-Type: application/json" \
     -H "X-API-Key: $INTERNAL_API_KEY" \
     -d '{"action":"testConnection"}' \
     $SERVICE_URL | jq .

echo "Tests completed!"