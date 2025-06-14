# Make sure you're in the tebra-php-api directory
pwd  # Should show .../tebra-php-api

# Force rebuild with a cache-busting change
echo "# Build: $(date)" >> Dockerfile

# Deploy with explicit build
gcloud run deploy tebra-php-api \
  --source . \
  --region us-central1 \
  --platform managed \
  --no-allow-unauthenticated \
  --set-secrets="TEBRA_USERNAME=TEBRA_USERNAME:latest,TEBRA_PASSWORD=TEBRA_PASSWORD:latest,TEBRA_WSDL_URL=tebra-wsdl-url:latest,TEBRA_CUSTOMER_KEY=TEBRA_CUSTOMER_KEY:latest,INTERNAL_API_KEY=tebra-internal-api-key:latest" \
  --service-account=tebra-cloud-run-sa@luknerlumina-firebase.iam.gserviceaccount.com