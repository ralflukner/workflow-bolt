#!/opt/homebrew/bin/bash
# scripts/cleanup-old-gsm-secrets.sh
#
# ⚠️  WARNING: This will permanently delete the old GSM secrets
# Only run this after confirming all services work with new secret names

set -e

echo "🗑️  Cleaning up old GSM secrets..."
echo "================================="
echo ""
echo "⚠️  This will PERMANENTLY DELETE the old secret names!"
read -p "Are you absolutely sure? Type 'DELETE' to confirm: " confirm

if [ "$confirm" != "DELETE" ]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Deleting old secrets..."

# Auth0 old secrets
gcloud secrets delete AUTH0_DOMAIN --quiet || true
gcloud secrets delete AUTH0_CLIENT_ID --quiet || true
gcloud secrets delete AUTH0_REDIRECT_URI --quiet || true
gcloud secrets delete AUTH0_AUDIENCE --quiet || true
gcloud secrets delete AUTH0_SCOPE --quiet || true
gcloud secrets delete auth0-domain --quiet || true
gcloud secrets delete auth0-audience --quiet || true

# Tebra old secrets
gcloud secrets delete tebra-username --quiet || true
gcloud secrets delete tebra-password --quiet || true
gcloud secrets delete tebra-customer-key --quiet || true
gcloud secrets delete tebra-wsdl-url --quiet || true
gcloud secrets delete tebra-api-key --quiet || true
gcloud secrets delete TEBRA_WSDL_URL --quiet || true
gcloud secrets delete TEBRA_PROXY_API_KEY --quiet || true

# Firebase old secrets
gcloud secrets delete FIREBASE_PROJECT_ID --quiet || true
gcloud secrets delete FIREBASE_API_KEY --quiet || true
gcloud secrets delete FIREBASE_AUTH_DOMAIN --quiet || true
gcloud secrets delete FIREBASE_STORAGE_BUCKET --quiet || true
gcloud secrets delete FIREBASE_MESSAGING_SENDER_ID --quiet || true
gcloud secrets delete FIREBASE_APP_ID --quiet || true
gcloud secrets delete FIREBASE_CONFIG --quiet || true
gcloud secrets delete firebase-config --quiet || true

# Patient encryption key old secrets
gcloud secrets delete PATIENT_ENCRYPTION_KEY --quiet || true
gcloud secrets delete patient-encryption-key --quiet || true

echo ""
echo "✅ Old secrets deleted!"
