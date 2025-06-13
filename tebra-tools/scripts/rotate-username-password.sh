#!/usr/bin/env bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
TOOLS_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$TOOLS_ROOT")"

set -euo pipefail

echo "=== Tebra Credentials Rotation Script ==="

# Check if required environment variables are set
if [ -z "${GOOGLE_CLOUD_PROJECT:-}" ]; then
    echo "❌ GOOGLE_CLOUD_PROJECT environment variable is not set"
    exit 1
fi

# Check if gcloud is authenticated
if ! gcloud auth print-access-token >/dev/null 2>&1; then
    echo "❌ Not authenticated with gcloud. Please run 'gcloud auth application-default login'"
    exit 1
fi

# Check if test-tebra.php exists
if [ ! -f "$TOOLS_ROOT/test-tebra.php" ]; then
    echo "❌ test-tebra.php not found in tebra-tools directory"
    exit 1
fi

# Function to get secret from GSM
get_secret() {
    local secret_name=$1
    gcloud secrets versions access latest --secret="$secret_name" 2>/dev/null || echo ""
}

# Function to update secret in GSM
update_secret() {
    local secret_name=$1
    local secret_value=$2
    
    echo "Updating $secret_name..."
    echo -n "$secret_value" | gcloud secrets versions add "$secret_name" --data-file=- 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ $secret_name updated successfully"
        return 0
    else
        echo "❌ Failed to update $secret_name"
        return 1
    fi
}

# Get current credentials
echo "Retrieving current credentials from GSM..."
CURRENT_USERNAME=$(get_secret "tebra-username")
CURRENT_PASSWORD=$(get_secret "tebra-password")
CURRENT_CUSTOMER_KEY=$(get_secret "tebra-customer-key")

if [ -z "$CURRENT_USERNAME" ] || [ -z "$CURRENT_PASSWORD" ] || [ -z "$CURRENT_CUSTOMER_KEY" ]; then
    echo "❌ Could not retrieve all secrets from GSM"
    echo "   Make sure you have access to: tebra-username, tebra-password, tebra-customer-key"
    exit 1
fi

echo "Current credentials retrieved successfully."
echo "Username: ${CURRENT_USERNAME:0:3}***"
echo "Customer Key: ${CURRENT_CUSTOMER_KEY:0:2}***"
echo

# Prompt for new credentials
echo "Please enter new credentials:"
read -p "New Username: " NEW_USERNAME
read -sp "New Password: " NEW_PASSWORD
echo
read -sp "New Customer Key: " NEW_CUSTOMER_KEY
echo

# Validate input
if [ -z "$NEW_USERNAME" ] || [ -z "$NEW_PASSWORD" ] || [ -z "$NEW_CUSTOMER_KEY" ]; then
    echo "❌ All fields are required"
    exit 1
fi

# Confirm update
echo -e "\nNew credentials will be:"
echo "Username: ${NEW_USERNAME:0:3}***"
echo "Customer Key: ${NEW_CUSTOMER_KEY:0:2}***"
read -p "Proceed with update? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Update cancelled"
    exit 0
fi

# Update secrets
echo -e "\nUpdating secrets in GSM..."
if ! update_secret "tebra-username" "$NEW_USERNAME"; then
    echo "❌ Failed to update username"
    exit 1
fi

if ! update_secret "tebra-password" "$NEW_PASSWORD"; then
    echo "❌ Failed to update password"
    exit 1
fi

if ! update_secret "tebra-customer-key" "$NEW_CUSTOMER_KEY"; then
    echo "❌ Failed to update customer key"
    exit 1
fi

# Test new credentials
echo -e "\nTesting new credentials..."
if php "$TOOLS_ROOT/test-tebra.php"; then
    echo "✅ New credentials verified successfully"
else
    echo "❌ New credentials failed verification"
    echo "   Rolling back to previous credentials..."
    
    if ! update_secret "tebra-username" "$CURRENT_USERNAME"; then
        echo "❌ Failed to rollback username"
    fi
    
    if ! update_secret "tebra-password" "$CURRENT_PASSWORD"; then
        echo "❌ Failed to rollback password"
    fi
    
    if ! update_secret "tebra-customer-key" "$CURRENT_CUSTOMER_KEY"; then
        echo "❌ Failed to rollback customer key"
    fi
    
    exit 1
fi

echo -e "\n=== Credential Rotation Complete ==="
echo "✅ All credentials updated successfully"
echo "✅ New credentials verified"
echo
echo "Next steps:"
echo "1. Update any local configuration files"
echo "2. Run security check: $SCRIPT_DIR/security-check-gsm.sh"
echo "3. Clean Git history if needed: $SCRIPT_DIR/git-cleanup.sh"