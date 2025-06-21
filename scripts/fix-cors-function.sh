#!/bin/bash

# Fix CORS for exchangeAuth0Token function

PROJECT_ID="luknerlumina-firebase"
REGION="us-central1"
FUNCTION_NAME="exchangeAuth0Token"

echo "🔧 Fixing CORS for $FUNCTION_NAME function..."

# Test current status
echo -e "\n📋 Current function status:"
gcloud functions describe $FUNCTION_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="table(state,serviceConfig.ingressSettings,serviceConfig.availableMemory)"

# Test with Firebase SDK-style request
echo -e "\n🧪 Testing Firebase callable function format..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"data":{"auth0Token":"test-token"}}' \
  https://$REGION-$PROJECT_ID.cloudfunctions.net/$FUNCTION_NAME \
  -w "\nHTTP Status: %{http_code}\n"

# Check service account permissions
echo -e "\n🔐 Checking service account permissions..."
SERVICE_ACCOUNT=$(gcloud functions describe $FUNCTION_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(serviceConfig.serviceAccountEmail)")

echo "Service Account: $SERVICE_ACCOUNT"

# List relevant IAM bindings
echo -e "\n📋 Service account IAM bindings:"
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:$SERVICE_ACCOUNT" \
  --format="table(bindings.role)" | head -20

# Check if service account has necessary roles
REQUIRED_ROLES=(
  "roles/iam.serviceAccountTokenCreator"
  "roles/secretmanager.secretAccessor"
  "roles/firebase.sdkAdminServiceAgent"
)

echo -e "\n✅ Checking required roles:"
for role in "${REQUIRED_ROLES[@]}"; do
  if gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:$SERVICE_ACCOUNT AND bindings.role:$role" \
    --format="value(bindings.role)" | grep -q "$role"; then
    echo "✓ $role - GRANTED"
  else
    echo "✗ $role - MISSING"
    echo "  To fix: gcloud projects add-iam-policy-binding $PROJECT_ID \\"
    echo "    --member=serviceAccount:$SERVICE_ACCOUNT \\"
    echo "    --role=$role"
  fi
done

echo -e "\n📊 Recent function invocations:"
gcloud functions logs read $FUNCTION_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --limit=10 \
  --format="table(time_utc,level,text)" | grep -E "(ERROR|WARNING|Invalid|Failed|denied)"