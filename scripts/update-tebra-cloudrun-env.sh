#!/bin/bash
set -euo pipefail

# This script updates the Cloud Run service to use environment variables instead of secrets

# Set the project ID and region
PROJECT_ID="luknerlumina-firebase"
REGION="us-central1"

# Update the Cloud Run service with environment variables
echo "Updating Cloud Run service with environment variables..."

gcloud run services update tebra-php-api \
  --project=$PROJECT_ID \
  --region=$REGION \
  --set-env-vars="TEBRA_USERNAME=pqpyiN-cAGRih-nEdayT-Cc@luknerclinic.com,TEBRA_PASSWORD=kPRu_w-eg8v.)-3=;(v4-6LK.78-5warim,TEBRA_WSDL_URL=https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl&customerkey=j57wt68dc39q,TEBRA_CUSTOMER_KEY=j57wt68dc39q,INTERNAL_API_KEY=UlmgPDMHoMqP2KAMKGIJK4tudPlm7z7ertoJ6eTV3+Y="

echo "Cloud Run service updated successfully!"