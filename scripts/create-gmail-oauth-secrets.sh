#!/bin/bash
set -euo pipefail

# This script creates the necessary OAuth2 secrets in Google Secret Manager for Gmail integration
# or updates existing secrets with new values

# Set the project ID
PROJECT_ID="luknerlumina-firebase"

# Initialize status variables
CLIENT_ID_CREATED=false
CLIENT_SECRET_CREATED=false
CLIENT_ID_UPDATED=false
CLIENT_SECRET_UPDATED=false
ACCESS_GRANTED=true

# Prompt for the OAuth2 credentials
echo "Please enter your OAuth2 credentials:"
read -p "OAuth2 Client ID: " CLIENT_ID
read -p "OAuth2 Client Secret: " CLIENT_SECRET

# Validate input
if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
  echo "Error: Both Client ID and Client Secret are required"
  exit 1
fi

echo "Managing OAuth2 secrets in Google Secret Manager..."

# Check if GMAIL_CLIENT_ID exists
if gcloud secrets describe GMAIL_CLIENT_ID --project=$PROJECT_ID &>/dev/null; then
  echo "Secret GMAIL_CLIENT_ID already exists. Updating with new value..."
  echo -n "$CLIENT_ID" | \
    gcloud secrets versions add GMAIL_CLIENT_ID \
    --project=$PROJECT_ID \
    --data-file=- && CLIENT_ID_UPDATED=true
else
  echo "Creating GMAIL_CLIENT_ID secret..."
  echo -n "$CLIENT_ID" | \
    gcloud secrets create GMAIL_CLIENT_ID \
    --project=$PROJECT_ID \
    --replication-policy="automatic" \
    --data-file=- && CLIENT_ID_CREATED=true
fi

# Check if GMAIL_CLIENT_SECRET exists
if gcloud secrets describe GMAIL_CLIENT_SECRET --project=$PROJECT_ID &>/dev/null; then
  echo "Secret GMAIL_CLIENT_SECRET already exists. Updating with new value..."
  echo -n "$CLIENT_SECRET" | \
    gcloud secrets versions add GMAIL_CLIENT_SECRET \
    --project=$PROJECT_ID \
    --data-file=- && CLIENT_SECRET_UPDATED=true
else
  echo "Creating GMAIL_CLIENT_SECRET secret..."
  echo -n "$CLIENT_SECRET" | \
    gcloud secrets create GMAIL_CLIENT_SECRET \
    --project=$PROJECT_ID \
    --replication-policy="automatic" \
    --data-file=- && CLIENT_SECRET_CREATED=true
fi

# Grant access to the service account
echo "Granting access to the service account..."
SERVICE_ACCOUNT="tebra-cloud-run-sa@luknerlumina-firebase.iam.gserviceaccount.com"

for SECRET_NAME in GMAIL_CLIENT_ID GMAIL_CLIENT_SECRET; do
  if ! gcloud secrets add-iam-policy-binding $SECRET_NAME \
    --project=$PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" &>/dev/null; then
    echo "Failed to grant access to $SECRET_NAME"
    ACCESS_GRANTED=false
  fi
done

# Print summary
echo ""
echo "Summary:"
if $CLIENT_ID_CREATED; then
  echo "- GMAIL_CLIENT_ID: Created successfully"
elif $CLIENT_ID_UPDATED; then
  echo "- GMAIL_CLIENT_ID: Updated successfully"
else
  echo "- GMAIL_CLIENT_ID: Failed to create or update"
fi

if $CLIENT_SECRET_CREATED; then
  echo "- GMAIL_CLIENT_SECRET: Created successfully"
elif $CLIENT_SECRET_UPDATED; then
  echo "- GMAIL_CLIENT_SECRET: Updated successfully"
else
  echo "- GMAIL_CLIENT_SECRET: Failed to create or update"
fi

if $ACCESS_GRANTED; then
  echo "- Service account access: Granted successfully"
else
  echo "- Service account access: Some permissions could not be granted"
fi

echo ""
if ($CLIENT_ID_CREATED || $CLIENT_ID_UPDATED) && ($CLIENT_SECRET_CREATED || $CLIENT_SECRET_UPDATED) && $ACCESS_GRANTED; then
  echo "✅ OAuth2 secrets managed and access granted successfully!"
else
  echo "⚠️ Some operations were not successful. Please check the logs above."
fi
