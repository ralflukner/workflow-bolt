#!/bin/bash

# Script to create admin debug token in Google Secret Manager
# This token is required for accessing the secured debug endpoint

# Function to display usage
show_usage() {
    echo "Usage: $0 [project-id]"
    echo "   or: PROJECT_ID=<project-id> $0"
    echo ""
    echo "This script creates an admin debug token in Google Secret Manager"
    echo "that is required for accessing the secured debug endpoint."
    echo ""
    echo "The token will be a cryptographically secure random string."
    echo ""
    echo "Environment Variables:"
    echo "  PROJECT_ID      - Google Cloud Project ID (alternative to command line parameter)"
}

# Function to validate project ID format
validate_project_id() {
    local project_id="$1"
    
    if [ -z "$project_id" ]; then
        echo "❌ Error: PROJECT_ID is required"
        echo "   Set it as an environment variable: PROJECT_ID='your-project-id'"
        echo "   Or pass it as a parameter: $0 <project-id>"
        return 1
    fi
    
    if [[ ! "$project_id" =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ ]]; then
        echo "❌ Error: Invalid PROJECT_ID format: '$project_id'"
        echo "   Project ID must be 6-30 characters, start with a letter,"
        echo "   contain only lowercase letters, numbers, and hyphens"
        return 1
    fi
    
    return 0
}

# Set variables
PROJECT_ID="${1:-$PROJECT_ID}"
SECRET_ID="tebra-admin-debug-token"

# Validate project ID
if ! validate_project_id "$PROJECT_ID"; then
    echo ""
    show_usage
    exit 1
fi

# Generate a cryptographically secure random token (64 characters)
echo "🔐 Generating cryptographically secure admin debug token..."
ADMIN_TOKEN=$(openssl rand -hex 32)

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to generate secure token"
    echo "   Make sure openssl is installed"
    exit 1
fi

echo "✅ Generated admin debug token (length: ${#ADMIN_TOKEN} characters)"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "   Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set the project
echo "🔧 Setting gcloud project to: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

# Check if secret already exists
echo "🔍 Checking if secret '$SECRET_ID' exists..."
if gcloud secrets describe "$SECRET_ID" --project="$PROJECT_ID" &> /dev/null; then
    echo "📝 Secret '$SECRET_ID' already exists. Creating a new version..."
    echo -n "$ADMIN_TOKEN" | gcloud secrets versions add "$SECRET_ID" --project="$PROJECT_ID" --data-file=-
else
    echo "🆕 Creating new secret '$SECRET_ID'..."
    echo -n "$ADMIN_TOKEN" | gcloud secrets create "$SECRET_ID" --project="$PROJECT_ID" --data-file=-
fi

if [ $? -eq 0 ]; then
    echo "✅ Successfully created/updated secret '$SECRET_ID' in project '$PROJECT_ID'"
else
    echo "❌ Failed to create/update secret '$SECRET_ID'"
    echo "💡 Common issues:"
    echo "   - Insufficient permissions for Secret Manager"
    echo "   - Network connectivity issues"
    echo "   - gcloud authentication expired"
    echo "   - Secret Manager API not enabled"
    exit 1
fi

# Grant access to the default service account (for Cloud Run)
SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"
echo "🔐 Granting access to service account: $SERVICE_ACCOUNT"
gcloud secrets add-iam-policy-binding "$SECRET_ID" \
    --project="$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"

if [ $? -eq 0 ]; then
    echo "✅ Successfully granted access to service account: $SERVICE_ACCOUNT"
else
    echo "❌ Failed to grant access to service account: $SERVICE_ACCOUNT"
    echo "⚠️  Secret was created but may not be accessible by Cloud Run"
    exit 1
fi

echo ""
echo "🎉 Admin Debug Token Setup Complete!"
echo "📋 Summary:"
echo "   Project ID: $PROJECT_ID"
echo "   Secret ID: $SECRET_ID"
echo "   Service Account: $SERVICE_ACCOUNT"
echo "   Token Length: ${#ADMIN_TOKEN} characters"
echo ""
echo "🔧 Next Steps:"
echo "   1. Set DEBUG_MODE_ENABLED=true in your Cloud Run environment"
echo "   2. Use the token with X-Admin-Token header when calling debug endpoint"
echo "   3. Example curl command:"
echo "      curl -H 'X-API-Key: your-api-key' \\"
echo "           -H 'X-Admin-Token: $ADMIN_TOKEN' \\"
echo "           https://your-service-url/debug/secrets"
echo ""
echo "⚠️  Security Notes:"
echo "   - Keep this token secure and rotate it regularly"
echo "   - Only share with authorized administrators"
echo "   - Monitor debug endpoint access in logs"
echo "   - Consider disabling debug mode in production" 