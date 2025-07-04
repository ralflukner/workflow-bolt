#!/opt/homebrew/bin/bash
set -euo pipefail  # Exit on error, undefined vars, pipe failures

# 0) Variables for reuse
PROJECT="luknerlumina-firebase"
REGION="us-central1"
CLOUD_RUN="tebra-php-api"
FUNCTION="tebraProxy"
SA_NAME="tebra-proxy-invoker"
SA_EMAIL="${SA_NAME}@${PROJECT}.iam.gserviceaccount.com"

# Get the script's directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "🔧 Setting up dedicated service account for tebraProxy..."
echo "📁 Project root: $PROJECT_ROOT"

# Change to project root
cd "$PROJECT_ROOT"

# 1. Create the dedicated service-account
echo "📦 Creating service account..."
gcloud iam service-accounts create "$SA_NAME" \
  --project "$PROJECT" \
  --display-name "Cloud Run invoker for tebraProxy" \
  --description "Minimal permissions SA for tebraProxy to invoke Cloud Run" || echo "✓ SA already exists"

# 2. Give it minimal permissions
echo "🔐 Granting IAM roles..."

# Cloud Run invoker permission
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.invoker" \
  --condition=None \
  --quiet

# Secret Manager access (if using secrets)
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None \
  --quiet

# Firestore access for rate limiting
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/datastore.user" \
  --condition=None \
  --quiet

# 3. Grant the SA invoker on the Cloud Run service specifically
echo "🚀 Granting Cloud Run service access..."
gcloud run services add-iam-policy-binding "$CLOUD_RUN" \
  --region "$REGION" \
  --project "$PROJECT" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.invoker" \
  --quiet

echo "✅ IAM setup complete!"

# 4. Update Firebase configuration
echo "🔧 Updating firebase.json..."
if [ -f "firebase.json" ]; then
    if command -v jq &> /dev/null; then
        # Check if functions section exists
        if jq -e '.functions' firebase.json > /dev/null 2>&1; then
            jq '.functions.serviceAccount = "'${SA_EMAIL}'"' firebase.json > firebase.json.tmp && mv firebase.json.tmp firebase.json
            echo "✅ Updated firebase.json with service account"
        else
            # Add functions section if it doesn't exist
            jq '. + {functions: {serviceAccount: "'${SA_EMAIL}'"}}' firebase.json > firebase.json.tmp && mv firebase.json.tmp firebase.json
            echo "✅ Added functions section to firebase.json"
        fi
    else
        echo "⚠️  Please manually add this to firebase.json under 'functions':"
        echo '  "serviceAccount": "'${SA_EMAIL}'"'
    fi
else
    echo "❌ firebase.json not found in project root"
fi

# 5. Deploy with new configuration (only if functions directory exists)
if [ -d "functions" ]; then
    echo "🚀 Deploying function with new service account..."
    cd functions && npm prune --production && cd ..
    firebase deploy --only functions:$FUNCTION \
      --project "$PROJECT"
    
    # 6. Test the deployment
    echo "⏳ Waiting 30s for function to be ready..."
    sleep 30
    
    echo "🧪 Running smoke test..."
    FUNCTION_URL="https://${REGION}-${PROJECT}.cloudfunctions.net/${FUNCTION}"
    ID_TOKEN=$(gcloud auth print-identity-token)
    
    curl -X POST "$FUNCTION_URL" \
      -H "Authorization: Bearer ${ID_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{"data":{"action":"cloudRunHealth"}}' \
      -w "\nHTTP Status: %{http_code}\n"
else
    echo "⚠️  Functions directory not found. Skipping deployment."
    echo "   Run 'firebase deploy --only functions:$FUNCTION' manually after updating firebase.json"
fi

# 7. Show current permissions
echo ""
echo "📋 Current IAM bindings for Cloud Run service:"
gcloud run services get-iam-policy "$CLOUD_RUN" \
  --region "$REGION" \
  --project "$PROJECT" \
  --format="table(bindings.role,bindings.members)" | grep -E "(ROLE|run.invoker)" || true

echo ""
echo "✅ Service account setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Verify firebase.json has: \"serviceAccount\": \"${SA_EMAIL}\""
echo "2. Deploy your function: firebase deploy --only functions:$FUNCTION"
echo "3. After testing, remove default SA access:"
echo "   gcloud run services remove-iam-policy-binding $CLOUD_RUN \\"
echo "     --region $REGION --project $PROJECT \\"
echo "     --member=\"serviceAccount:${PROJECT}@appspot.gserviceaccount.com\" \\"
echo "     --role=\"roles/run.invoker\""