#!/bin/bash

# Script to create patient encryption key in Google Secret Manager

# Set variables
PROJECT_ID="luknerlumina-firebase"
SECRET_ID="patient-encryption-key"
ENCRYPTION_KEY="$1"

# Check if encryption key is provided
if [ -z "$ENCRYPTION_KEY" ]; then
    echo "Error: Please provide the encryption key as an argument"
    echo "Usage: $0 <encryption-key>"
    echo "Example: $0 'your-256-bit-encryption-key'"
    exit 1
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Check if secret already exists
if gcloud secrets describe $SECRET_ID --project=$PROJECT_ID &> /dev/null; then
    echo "Secret '$SECRET_ID' already exists. Creating a new version..."
    echo -n "$ENCRYPTION_KEY" | gcloud secrets versions add $SECRET_ID --project=$PROJECT_ID --data-file=-
else
    echo "Creating new secret '$SECRET_ID'..."
    echo -n "$ENCRYPTION_KEY" | gcloud secrets create $SECRET_ID --project=$PROJECT_ID --data-file=-
fi

if [ $? -eq 0 ]; then
    echo "✅ Successfully created/updated secret '$SECRET_ID' in project '$PROJECT_ID'"
else
    echo "❌ Failed to create/update secret"
    exit 1
fi

# Grant access to the default service account (for Firebase Functions)
SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"
echo "Granting access to service account: $SERVICE_ACCOUNT"
gcloud secrets add-iam-policy-binding $SECRET_ID \
    --project=$PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"

echo "✅ Setup complete!"