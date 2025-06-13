#!/bin/bash

# GSM Diagnostic Script for Tebra Credentials
# Helps diagnose and fix Google Secret Manager issues

echo "=== Google Secret Manager Diagnostic ==="
echo "Project: $(gcloud config get-value project)"
echo "Authentication: $(gcloud auth list --filter=status:ACTIVE --format="value(account)")"
echo

# Check if secrets exist
echo "Checking if secrets exist..."
SECRETS=("tebra-username" "tebra-password" "tebra-customer-key")

for secret in "${SECRETS[@]}"; do
    echo -n "  $secret: "
    if gcloud secrets describe "$secret" --quiet >/dev/null 2>&1; then
        echo "✓ EXISTS"
        
        # Check if secret has versions
        VERSION_COUNT=$(gcloud secrets versions list "$secret" --format="value(name)" | wc -l)
        echo "    Versions: $VERSION_COUNT"
        
        # Check latest version
        LATEST_VERSION=$(gcloud secrets versions list "$secret" --limit=1 --format="value(name)")
        echo "    Latest version: $LATEST_VERSION"
        
        # Try to access the secret
        echo -n "    Access test: "
        if SECRET_VALUE=$(gcloud secrets versions access latest --secret="$secret" 2>/dev/null); then
            echo "✓ ACCESSIBLE"
            echo "    Value length: ${#SECRET_VALUE} characters"
            echo "    First 3 chars: ${SECRET_VALUE:0:3}***"
        else
            echo "✗ ACCESS FAILED"
            echo "    Error accessing secret value"
        fi
    else
        echo "✗ MISSING"
    fi
    echo
done

echo "=== Creating Missing Secrets ==="
echo "If any secrets are missing, you can create them with:"
echo
echo "# For username (replace with your actual username):"
echo "echo -n 'your-username@luknerclinic.com' | gcloud secrets create tebra-username --data-file=-"
echo
echo "# For password (replace with your actual password):"
echo "echo -n 'your-actual-password' | gcloud secrets create tebra-password --data-file=-"
echo
echo "# For customer key (replace with your actual key):"
echo "echo -n 'your-customer-key' | gcloud secrets create tebra-customer-key --data-file=-"
echo

echo "=== Checking IAM Permissions ==="
echo "Current user IAM permissions for Secret Manager:"
gcloud projects get-iam-policy $(gcloud config get-value project) \
    --flatten="bindings[].members" \
    --format="table(bindings.role,bindings.members)" \
    --filter="bindings.members:$(gcloud auth list --filter=status:ACTIVE --format="value(account)" )" | grep secretmanager

echo
echo "=== Recommended Fix Commands ==="
echo "1. Grant yourself Secret Manager access:"
echo "   gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
     --member=\"user:$(gcloud auth list --filter=status:ACTIVE --format=\"value(account)\")\" \
     --role=\"roles/secretmanager.admin\""
echo
echo "2. If secrets exist but are inaccessible, update them:"
echo "   echo -n 'new-value' | gcloud secrets versions add secret-name --data-file=-" 