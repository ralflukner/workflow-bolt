#!/bin/bash

# Setup script for Tebra PHP API Cloud Run deployment

set -e

PROJECT_ID="luknerlumina-firebase"
SERVICE_ACCOUNT_NAME="tebra-php-api"
SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

echo "🔧 Setting up Cloud Run service account and permissions..."
echo "Project: $PROJECT_ID"
echo "Service Account: $SERVICE_ACCOUNT_EMAIL"
echo ""

# Set the project
gcloud config set project $PROJECT_ID

# Create service account if it doesn't exist
echo "👤 Creating service account (if not exists)..."
if ! gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL &>/dev/null; then
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="Tebra PHP API Service Account" \
        --description="Service account for Tebra PHP API on Cloud Run"
    echo "✅ Service account created"
else
    echo "✅ Service account already exists"
fi

# Grant necessary roles to the service account
echo ""
echo "🔐 Granting roles to service account..."

# Secret Manager Secret Accessor (to read secrets)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/secretmanager.secretAccessor"

# Cloud Run Invoker (if needed for internal services)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/run.invoker"

echo "✅ Roles granted"

# Grant access to specific secrets
echo ""
echo "🔑 Granting access to secrets..."

SECRETS=(
    "tebra-username"
    "tebra-password"
    "tebra-customer-key"
    "tebra-internal-api-key"
    "tebra-admin-debug-token"
)

for SECRET in "${SECRETS[@]}"; do
    echo "   - Granting access to $SECRET..."
    if gcloud secrets describe $SECRET &>/dev/null; then
        gcloud secrets add-iam-policy-binding $SECRET \
            --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
            --role="roles/secretmanager.secretAccessor" \
            --quiet
    else
        echo "     ⚠️  Secret $SECRET does not exist. Create it with:"
        echo "     echo -n 'your-value' | gcloud secrets create $SECRET --data-file=-"
    fi
done

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Create any missing secrets listed above"
echo "2. Run ./deploy.sh to deploy the service"
echo "3. Update Firestore config with the service URL"