#!/bin/bash

# =============================================================================
# Patient Encryption Key Setup Script for Google Secret Manager (GSM)
# =============================================================================
#
# This script creates or updates a patient encryption key in Google Secret Manager
# and configures proper access permissions for Firebase Functions.
#
# FEATURES:
# - Accepts PROJECT_ID as command line parameter or environment variable
# - Validates project ID format and accessibility
# - Checks and enables Secret Manager API if needed
# - Creates/updates encryption key secret in GSM
# - Grants access to Firebase service account
# - Comprehensive error handling and user feedback
#
# REQUIREMENTS:
# - gcloud CLI installed and authenticated
# - Appropriate permissions for Secret Manager
# - Valid Google Cloud Project ID
#
# USAGE EXAMPLES:
#   ./create-patient-encryption-secret.sh 'your-256-bit-key' 'my-project-id'
#   PROJECT_ID='my-project-id' ./create-patient-encryption-secret.sh 'your-key'
#   ./create-patient-encryption-secret.sh 'your-key'  # Uses PROJECT_ID env var
#
# SECURITY NOTES:
# - Encryption key must be at least 32 characters for adequate security
# - Secret is stored in Google Secret Manager with proper IAM controls
# - Access is granted only to the Firebase service account
# - Consider implementing secret rotation policies
#
# =============================================================================

# Function to display usage
show_usage() {
    echo "Usage: $0 <encryption-key> [project-id]"
    echo "   or: PROJECT_ID=<project-id> $0 <encryption-key>"
    echo ""
    echo "Parameters:"
    echo "  encryption-key  - The 256-bit encryption key to store in GSM"
    echo "  project-id      - Google Cloud Project ID (optional if PROJECT_ID env var is set)"
    echo ""
    echo "Environment Variables:"
    echo "  PROJECT_ID      - Google Cloud Project ID (alternative to command line parameter)"
    echo ""
    echo "Examples:"
    echo "  $0 'your-256-bit-encryption-key' 'my-project-id'"
    echo "  PROJECT_ID='my-project-id' $0 'your-256-bit-encryption-key'"
    echo "  $0 'your-256-bit-encryption-key'  # Uses PROJECT_ID env var"
    echo ""
    echo "Note: The script will create/update the secret 'patient-encryption-key' in GSM"
    echo "      and grant access to the default Firebase service account."
}

# Function to validate project ID format
validate_project_id() {
    local project_id="$1"
    
    # Check if project ID is provided
    if [ -z "$project_id" ]; then
        echo "❌ Error: PROJECT_ID is required"
        echo "   Set it as an environment variable: PROJECT_ID='your-project-id'"
        echo "   Or pass it as the second parameter: $0 <encryption-key> <project-id>"
        return 1
    fi
    
    # Basic validation: project ID should be 6-30 characters, lowercase letters, numbers, hyphens
    if [[ ! "$project_id" =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ ]]; then
        echo "❌ Error: Invalid PROJECT_ID format: '$project_id'"
        echo "   Project ID must be 6-30 characters, start with a letter,"
        echo "   contain only lowercase letters, numbers, and hyphens"
        return 1
    fi
    
    return 0
}

# Function to check if project exists and is accessible
check_project_access() {
    local project_id="$1"
    
    echo "🔍 Checking access to project: $project_id"
    
    # Check if project exists and we have access
    if ! gcloud projects describe "$project_id" &> /dev/null; then
        echo "❌ Error: Cannot access project '$project_id'"
        echo "   Possible issues:"
        echo "   - Project does not exist"
        echo "   - Insufficient permissions"
        echo "   - gcloud not authenticated"
        echo "   - Network connectivity issues"
        echo ""
        echo "💡 Try running: gcloud auth login"
        echo "💡 Verify project exists: gcloud projects list"
        return 1
    fi
    
    echo "✅ Project access confirmed"
    return 0
}

# Function to check GSM API is enabled
check_gsm_api() {
    local project_id="$1"
    
    echo "🔍 Checking if Secret Manager API is enabled..."
    
    if ! gcloud services list --enabled --filter="name:secretmanager.googleapis.com" --project="$project_id" &> /dev/null; then
        echo "⚠️  Secret Manager API is not enabled for project '$project_id'"
        echo "   Enabling Secret Manager API..."
        
        if gcloud services enable secretmanager.googleapis.com --project="$project_id"; then
            echo "✅ Secret Manager API enabled successfully"
        else
            echo "❌ Failed to enable Secret Manager API"
            echo "   You may need to enable it manually in the Google Cloud Console"
            return 1
        fi
    else
        echo "✅ Secret Manager API is already enabled"
    fi
    
    return 0
}

# Set variables
ENCRYPTION_KEY="$1"
PROJECT_ID="${2:-$PROJECT_ID}"  # Use second parameter or environment variable
SECRET_ID="patient-encryption-key"

# Check if encryption key is provided
if [ -z "$ENCRYPTION_KEY" ]; then
    echo "❌ Error: Encryption key is required"
    echo ""
    show_usage
    exit 1
fi

# Validate project ID
if ! validate_project_id "$PROJECT_ID"; then
    echo ""
    show_usage
    exit 1
fi

# Validate encryption key length (256-bit = 32 bytes = 64 hex chars or 44 base64 chars)
KEY_LENGTH=${#ENCRYPTION_KEY}
if [ $KEY_LENGTH -lt 32 ]; then
    echo "❌ Error: Encryption key must be at least 32 characters long for adequate security"
    echo "   Current length: $KEY_LENGTH characters"
    echo "   Recommended: Use a 256-bit key (32+ characters)"
    exit 1
fi

echo "✅ Encryption key validation passed (length: $KEY_LENGTH characters)"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "   Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check project access
if ! check_project_access "$PROJECT_ID"; then
    exit 1
fi

# Check GSM API
if ! check_gsm_api "$PROJECT_ID"; then
    exit 1
fi

# Set the project
echo "🔧 Setting gcloud project to: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

# Check if secret already exists
echo "🔍 Checking if secret '$SECRET_ID' exists..."
if gcloud secrets describe "$SECRET_ID" --project="$PROJECT_ID" &> /dev/null; then
    echo "📝 Secret '$SECRET_ID' already exists. Creating a new version..."
    echo -n "$ENCRYPTION_KEY" | gcloud secrets versions add "$SECRET_ID" --project="$PROJECT_ID" --data-file=-
else
    echo "🆕 Creating new secret '$SECRET_ID'..."
    echo -n "$ENCRYPTION_KEY" | gcloud secrets create "$SECRET_ID" --project="$PROJECT_ID" --data-file=-
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

# Grant access to the default service account (for Firebase Functions)
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
    echo "⚠️  Secret was created but may not be accessible by Firebase Functions"
    echo "💡 You may need to manually grant access in the Google Cloud Console"
    exit 1
fi

echo ""
echo "🎉 GSM Setup Complete!"
echo "📋 Summary:"
echo "   Project ID: $PROJECT_ID"
echo "   Secret ID: $SECRET_ID"
echo "   Service Account: $SERVICE_ACCOUNT"
echo "   Key Length: $KEY_LENGTH characters"
echo ""
echo "💡 Next steps:"
echo "   - Verify the secret in Google Cloud Console: https://console.cloud.google.com/security/secret-manager"
echo "   - Test access from your application"
echo "   - Consider setting up secret rotation policies"