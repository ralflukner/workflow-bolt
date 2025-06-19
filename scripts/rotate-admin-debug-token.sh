#!/bin/bash

# Script to rotate the admin debug token in Google Secret Manager
# This script creates a new version of the existing token

# Function to display usage
show_usage() {
    echo "Usage: $0 [project-id]"
    echo "   or: PROJECT_ID=<project-id> $0"
    echo ""
    echo "This script rotates the admin debug token by creating a new version"
    echo "in Google Secret Manager. The old version is kept for rollback purposes."
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

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "   Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if secret exists
echo "🔍 Checking if secret '$SECRET_ID' exists..."
if ! gcloud secrets describe "$SECRET_ID" --project="$PROJECT_ID" &> /dev/null; then
    echo "❌ Error: Secret '$SECRET_ID' does not exist in project '$PROJECT_ID'"
    echo "   Run create-admin-debug-token.sh first to create the secret"
    exit 1
fi

# Generate a new cryptographically secure random token
echo "🔐 Generating new cryptographically secure admin debug token..."
NEW_ADMIN_TOKEN=$(openssl rand -hex 32)

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to generate secure token"
    echo "   Make sure openssl is installed"
    exit 1
fi

echo "✅ Generated new admin debug token (length: ${#NEW_ADMIN_TOKEN} characters)"

# Set the project
echo "🔧 Setting gcloud project to: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

# Get current version info
echo "📊 Getting current secret version information..."
CURRENT_VERSION=$(gcloud secrets versions list "$SECRET_ID" --project="$PROJECT_ID" --format="value(name)" --limit=1 --sort-by=~createTime)

if [ -z "$CURRENT_VERSION" ]; then
    echo "❌ Error: Could not retrieve current secret version"
    exit 1
fi

echo "   Current version: $CURRENT_VERSION"

# Create new version
echo "🔄 Creating new version of secret '$SECRET_ID'..."
echo -n "$NEW_ADMIN_TOKEN" | gcloud secrets versions add "$SECRET_ID" --project="$PROJECT_ID" --data-file=-

if [ $? -eq 0 ]; then
    echo "✅ Successfully created new version of secret '$SECRET_ID'"
else
    echo "❌ Failed to create new version of secret '$SECRET_ID'"
    exit 1
fi

# Get new version info
NEW_VERSION=$(gcloud secrets versions list "$SECRET_ID" --project="$PROJECT_ID" --format="value(name)" --limit=1 --sort-by=~createTime)
echo "   New version: $NEW_VERSION"

# Display rotation summary
echo ""
echo "🎉 Admin Debug Token Rotation Complete!"
echo "📋 Summary:"
echo "   Project ID: $PROJECT_ID"
echo "   Secret ID: $SECRET_ID"
echo "   Previous Version: $CURRENT_VERSION"
echo "   New Version: $NEW_VERSION"
echo "   New Token Length: ${#NEW_ADMIN_TOKEN} characters"
echo ""
echo "🔧 Next Steps:"
echo "   1. Update your client applications with the new token"
echo "   2. Test the debug endpoint with the new token"
echo "   3. Monitor for any authentication failures"
echo "   4. After confirming everything works, you can disable the old version:"
echo "      gcloud secrets versions disable $CURRENT_VERSION --secret=$SECRET_ID --project=$PROJECT_ID"
echo ""
echo "⚠️  Security Notes:"
echo "   - The old version is still active for rollback purposes"
echo "   - Update all clients before disabling the old version"
echo "   - Monitor logs for authentication failures during transition"
echo "   - Consider using the test script to verify the new token works"
echo ""
echo "🧪 Test the new token:"
echo "   export TEBRA_ADMIN_DEBUG_TOKEN='$NEW_ADMIN_TOKEN'"
echo "   php tebra-php-api/test-debug-endpoint.php" 