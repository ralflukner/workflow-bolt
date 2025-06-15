#!/bin/bash
set -euo pipefail

# This script creates the necessary OAuth2 secrets in Google Secret Manager for Gmail integration

# Set the project ID
PROJECT_ID="luknerlumina-firebase"

# Create the secrets if they don't exist
echo "Creating OAuth2 secrets in Google Secret Manager..."

# GMAIL_CLIENT_ID
echo -n "623450773640-4dsrvor05a97cfuc68didco12sh76h04.apps.googleusercontent.com" | \
  gcloud secrets create GMAIL_CLIENT_ID \
  --project=$PROJECT_ID \
  --replication-policy="automatic" \
  --data-file=- || \
  echo "Secret GMAIL_CLIENT_ID already exists"

# GMAIL_CLIENT_SECRET
echo -n "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" | \
  gcloud secrets create GMAIL_CLIENT_SECRET \
  --project=$PROJECT_ID \
  --replication-policy="automatic" \
  --data-file=- || \
  echo "Secret GMAIL_CLIENT_SECRET already exists"

# Grant access to the service account
echo "Granting access to the service account..."
SERVICE_ACCOUNT="tebra-cloud-run-sa@luknerlumina-firebase.iam.gserviceaccount.com"

for SECRET_NAME in GMAIL_CLIENT_ID GMAIL_CLIENT_SECRET; do
  gcloud secrets add-iam-policy-binding $SECRET_NAME \
    --project=$PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" || \
    echo "Failed to grant access to $SECRET_NAME"
done

echo "OAuth2 secrets created and access granted successfully!"