#!/opt/homebrew/bin/bash
set -euo pipefail

# This script creates the necessary Service Account secrets in Google Secret Manager for Gmail integration
# using the Domain-Wide Delegation approach (production-grade for HIPAA environments)

# Set the project ID
PROJECT_ID="luknerlumina-firebase"

# Prompt for service account email
read -p "Enter the service account email (e.g., gmail-service-account@luknerlumina-firebase.iam.gserviceaccount.com): " SERVICE_ACCOUNT_EMAIL

# Prompt for service account private key file
read -p "Enter the path to the service account private key JSON file: " PRIVATE_KEY_FILE

# Validate inputs
if [ -z "$SERVICE_ACCOUNT_EMAIL" ]; then
  echo "Error: Service account email is required"
  exit 1
fi

if [ -z "$PRIVATE_KEY_FILE" ] || [ ! -f "$PRIVATE_KEY_FILE" ]; then
  echo "Error: Private key file not found at $PRIVATE_KEY_FILE"
  exit 1
fi

# Extract private key from JSON file
PRIVATE_KEY=$(grep -o '"private_key": "[^"]*' "$PRIVATE_KEY_FILE" | cut -d'"' -f4 | sed 's/\\n/\\\\n/g')

if [ -z "$PRIVATE_KEY" ]; then
  echo "Error: Could not extract private key from $PRIVATE_KEY_FILE"
  exit 1
fi

echo "Creating Service Account secrets in Google Secret Manager..."

# GMAIL_SERVICE_ACCOUNT_EMAIL
echo -n "$SERVICE_ACCOUNT_EMAIL" | \
  gcloud secrets create GMAIL_SERVICE_ACCOUNT_EMAIL \
  --project=$PROJECT_ID \
  --replication-policy="automatic" \
  --data-file=- || \
  echo "Secret GMAIL_SERVICE_ACCOUNT_EMAIL already exists"

# GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY
echo -n "$PRIVATE_KEY" | \
  gcloud secrets create GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY \
  --project=$PROJECT_ID \
  --replication-policy="automatic" \
  --data-file=- || \
  echo "Secret GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY already exists"

# Grant access to the service account
echo "Granting access to the service account..."
SERVICE_ACCOUNT="tebra-cloud-run-sa@luknerlumina-firebase.iam.gserviceaccount.com"

for SECRET_NAME in GMAIL_SERVICE_ACCOUNT_EMAIL GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY; do
  gcloud secrets add-iam-policy-binding $SECRET_NAME \
    --project=$PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" || \
    echo "Failed to grant access to $SECRET_NAME"
done

echo "Service Account secrets created and access granted successfully!"
echo ""
echo "Next steps:"
echo "1. Configure Domain-Wide Delegation in Google Workspace Admin Console"
echo "2. Deploy your functions with the new environment variables"
echo "3. Test the email functionality"
echo ""
echo "For detailed instructions, see functions/src/services/SERVICE_ACCOUNT_README.md"