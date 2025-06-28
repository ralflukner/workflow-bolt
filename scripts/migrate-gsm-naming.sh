#!/opt/homebrew/bin/bash
# scripts/migrate-gsm-naming.sh

set -e

echo "🔄 Migrating GSM secrets to standardized naming..."
echo "================================================"
echo ""
echo "⚠️  This will:"
echo "  1. Create new secrets with VITE_ prefixes"
echo "  2. Copy values from old secrets"
echo "  3. Keep old secrets intact (deletion commands provided but commented out)"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# Function to copy secret to new name
migrate_secret() {
    local old_name="$1"
    local new_name="$2"

    echo ""
    echo "📝 Migrating: $old_name → $new_name"

    # Check if old secret exists
    if ! gcloud secrets describe "$old_name" &>/dev/null; then
        echo "   ⚠️  Source secret '$old_name' not found - skipping"
        return
    fi

    # Check if new secret already exists
    if gcloud secrets describe "$new_name" &>/dev/null; then
        echo "   ℹ️  Target secret '$new_name' already exists - skipping"
        return
    fi

    # Get value from old secret
    local value
    value=$(gcloud secrets versions access latest --secret="$old_name")

    # Create new secret with value
    echo -n "$value" | gcloud secrets create "$new_name" --data-file=-
    echo "   ✅ Created $new_name"
}

# Migrate Auth0 secrets
migrate_secret "AUTH0_DOMAIN" "VITE_AUTH0_DOMAIN"
migrate_secret "AUTH0_CLIENT_ID" "VITE_AUTH0_CLIENT_ID"
migrate_secret "AUTH0_REDIRECT_URI" "VITE_AUTH0_REDIRECT_URI"
migrate_secret "AUTH0_AUDIENCE" "VITE_AUTH0_AUDIENCE"
migrate_secret "AUTH0_SCOPE" "VITE_AUTH0_SCOPE"

# Migrate Tebra secrets
migrate_secret "tebra-username" "VITE_TEBRA_USERNAME"
migrate_secret "tebra-password" "VITE_TEBRA_PASSWORD"
migrate_secret "tebra-customer-key" "VITE_TEBRA_CUSTOMER_KEY"
migrate_secret "TEBRA_WSDL_URL" "VITE_TEBRA_WSDL_URL"
migrate_secret "TEBRA_PROXY_API_KEY" "VITE_TEBRA_PROXY_API_KEY"

# Migrate Firebase secrets
migrate_secret "FIREBASE_PROJECT_ID" "VITE_FIREBASE_PROJECT_ID"
migrate_secret "FIREBASE_API_KEY" "VITE_FIREBASE_API_KEY"
migrate_secret "FIREBASE_AUTH_DOMAIN" "VITE_FIREBASE_AUTH_DOMAIN"
migrate_secret "FIREBASE_STORAGE_BUCKET" "VITE_FIREBASE_STORAGE_BUCKET"
migrate_secret "FIREBASE_MESSAGING_SENDER_ID" "VITE_FIREBASE_MESSAGING_SENDER_ID"
migrate_secret "FIREBASE_APP_ID" "VITE_FIREBASE_APP_ID"
migrate_secret "FIREBASE_CONFIG" "VITE_FIREBASE_CONFIG"

# Migrate patient encryption key
migrate_secret "PATIENT_ENCRYPTION_KEY" "VITE_PATIENT_ENCRYPTION_KEY"

echo ""
echo "✅ Migration complete!"
echo ""
echo "📋 OLD SECRETS TO DELETE (commented out for safety):"
echo "---------------------------------------------------"
echo "# Save these commands for later when you're ready to clean up:"
echo ""
cat << 'EOF'
# Auth0 old secrets
# gcloud secrets delete AUTH0_DOMAIN --quiet
# gcloud secrets delete AUTH0_CLIENT_ID --quiet
# gcloud secrets delete AUTH0_REDIRECT_URI --quiet
# gcloud secrets delete AUTH0_AUDIENCE --quiet
# gcloud secrets delete AUTH0_SCOPE --quiet
# gcloud secrets delete auth0-domain --quiet
# gcloud secrets delete auth0-audience --quiet

# Tebra old secrets
# gcloud secrets delete tebra-username --quiet
# gcloud secrets delete tebra-password --quiet
# gcloud secrets delete tebra-customer-key --quiet
# gcloud secrets delete tebra-wsdl-url --quiet
# gcloud secrets delete tebra-api-key --quiet
# gcloud secrets delete TEBRA_WSDL_URL --quiet
# gcloud secrets delete TEBRA_PROXY_API_KEY --quiet

# Firebase old secrets
# gcloud secrets delete FIREBASE_PROJECT_ID --quiet
# gcloud secrets delete FIREBASE_API_KEY --quiet
# gcloud secrets delete FIREBASE_AUTH_DOMAIN --quiet
# gcloud secrets delete FIREBASE_STORAGE_BUCKET --quiet
# gcloud secrets delete FIREBASE_MESSAGING_SENDER_ID --quiet
# gcloud secrets delete FIREBASE_APP_ID --quiet
# gcloud secrets delete FIREBASE_CONFIG --quiet
# gcloud secrets delete firebase-config --quiet

# Patient encryption key old secrets
# gcloud secrets delete PATIENT_ENCRYPTION_KEY --quiet
# gcloud secrets delete patient-encryption-key --quiet
EOF

echo ""
echo "💡 Next steps:"
echo "1. Run: ./scripts/sync-env-from-gsm.sh (using new standardized names)"
echo "2. Run: ./scripts/verify-env-gsm-consistency.sh"
echo "3. Test your application thoroughly"
echo "4. Update any Cloud Run services to use new secret names"
echo "5. Once everything is confirmed working, run the deletion commands above"
echo ""
echo "📁 The deletion commands have been saved to: scripts/cleanup-old-gsm-secrets.sh"

# Save deletion commands to a separate script for later use
cat > scripts/cleanup-old-gsm-secrets.sh << 'EOF'
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
EOF

chmod +x scripts/cleanup-old-gsm-secrets.sh