#!/bin/bash
set -euo pipefail

# This script creates the necessary secrets in Google Secret Manager for the Tebra API

# Set the project ID
PROJECT_ID="luknerlumina-firebase"

# Create the secrets if they don't exist
echo "Creating secrets in Google Secret Manager..."

# TEBRA_USERNAME
echo -n "pqpyiN-cAGRih-nEdayT-Cc@luknerclinic.com" | \
  gcloud secrets create TEBRA_USERNAME \
  --project=$PROJECT_ID \
  --replication-policy="automatic" \
  --data-file=- || \
  echo "Secret TEBRA_USERNAME already exists"

# TEBRA_PASSWORD
echo -n "kPRu_w-eg8v.)-3=;(v4-6LK.78-5warim" | \
  gcloud secrets create TEBRA_PASSWORD \
  --project=$PROJECT_ID \
  --replication-policy="automatic" \
  --data-file=- || \
  echo "Secret TEBRA_PASSWORD already exists"

# TEBRA_WSDL_URL
echo -n "https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl&customerkey=j57wt68dc39q" | \
  gcloud secrets create tebra-wsdl-url \
  --project=$PROJECT_ID \
  --replication-policy="automatic" \
  --data-file=- || \
  echo "Secret tebra-wsdl-url already exists"

# TEBRA_CUSTOMER_KEY
echo -n "j57wt68dc39q" | \
  gcloud secrets create TEBRA_CUSTOMER_KEY \
  --project=$PROJECT_ID \
  --replication-policy="automatic" \
  --data-file=- || \
  echo "Secret TEBRA_CUSTOMER_KEY already exists"

# INTERNAL_API_KEY
echo -n "<YOUR_API_KEY>" | \
  gcloud secrets create tebra-internal-api-key \
  --project=$PROJECT_ID \
  --replication-policy="automatic" \
  --data-file=- || \
  echo "Secret tebra-internal-api-key already exists"

# Grant access to the service account
echo "Granting access to the service account..."
SERVICE_ACCOUNT="tebra-cloud-run-sa@luknerlumina-firebase.iam.gserviceaccount.com"

for SECRET_NAME in TEBRA_USERNAME TEBRA_PASSWORD tebra-wsdl-url TEBRA_CUSTOMER_KEY tebra-internal-api-key; do
  gcloud secrets add-iam-policy-binding $SECRET_NAME \
    --project=$PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" || \
    echo "Failed to grant access to $SECRET_NAME"
done

echo "Secrets created and access granted successfully!"