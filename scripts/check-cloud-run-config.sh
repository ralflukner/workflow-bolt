#!/opt/homebrew/bin/bash

# Check Cloud Run configuration for Tebra PHP API

echo "Checking Cloud Run service configuration..."
echo "========================================="

# Check if service exists
echo "1. Checking if service exists..."
gcloud run services describe tebra-php-api \
  --region=us-central1 \
  --project=luknerlumina-firebase \
  --format="value(name)" 2>/dev/null

if [ $? -ne 0 ]; then
  echo "❌ Service 'tebra-php-api' not found!"
  exit 1
fi

echo "✅ Service found"

# Check service URL
echo -e "\n2. Service URL:"
gcloud run services describe tebra-php-api \
  --region=us-central1 \
  --project=luknerlumina-firebase \
  --format="value(status.url)"

# Check environment variables
echo -e "\n3. Environment variables:"
gcloud run services describe tebra-php-api \
  --region=us-central1 \
  --project=luknerlumina-firebase \
  --format="table(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)" 2>/dev/null

# Check if internal API key is configured
echo -e "\n4. Checking for INTERNAL_API_KEY..."
ENV_VARS=$(gcloud run services describe tebra-php-api \
  --region=us-central1 \
  --project=luknerlumina-firebase \
  --format="value(spec.template.spec.containers[0].env[].name)" 2>/dev/null)

if echo "$ENV_VARS" | grep -q "INTERNAL_API_KEY"; then
  echo "✅ INTERNAL_API_KEY is configured"
else
  echo "❌ INTERNAL_API_KEY is NOT configured"
  echo "   Run this command to add it:"
  echo "   gcloud run services update tebra-php-api \\\n  echo "     --update-env-vars=\"INTERNAL_API_KEY=<YOUR_API_KEY>\" \\\n"
fi

# Check secrets
echo -e "\n5. Checking Google Secret Manager secrets..."
SECRETS=$(gcloud secrets list --project=luknerlumina-firebase --format="value(name)" 2>/dev/null)

if echo "$SECRETS" | grep -q "tebra-internal-api-key"; then
  echo "✅ tebra-internal-api-key exists in Secret Manager"
else
  echo "❌ tebra-internal-api-key NOT found in Secret Manager"
  echo "   Run this command to create it:"
  echo "   echo -n \"<YOUR_API_KEY>\" | \\\n"
  echo "   gcloud secrets create tebra-internal-api-key --data-file=- --project=luknerlumina-firebase"
fi

# Test the API
echo -e "\n6. Testing API health endpoint..."
URL=$(gcloud run services describe tebra-php-api \
  --region=us-central1 \
  --project=luknerlumina-firebase \
  --format="value(status.url)" 2>/dev/null)

if [ ! -z "$URL" ]; then
  HEALTH_RESPONSE=$(curl -s "$URL/health" 2>/dev/null)
  if [ $? -eq 0 ]; then
    echo "✅ Health endpoint responded"
    echo "   Response: $HEALTH_RESPONSE"
  else
    echo "❌ Health endpoint failed to respond"
  fi
fi

echo -e "\n========================================="
echo "Configuration check complete!"