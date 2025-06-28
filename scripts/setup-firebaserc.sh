#!/bin/bash

# Generate .firebaserc from environment variables or gcloud config
# This script creates a .firebaserc file from .firebaserc.template
# Usage: ./scripts/setup-firebaserc.sh

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEMPLATE_FILE="$PROJECT_ROOT/.firebaserc.template"
OUTPUT_FILE="$PROJECT_ROOT/.firebaserc"

echo "🔧 Setting up Firebase configuration..."

# Check if template exists
if [[ ! -f "$TEMPLATE_FILE" ]]; then
    echo "❌ Error: .firebaserc.template not found at $TEMPLATE_FILE"
    echo "   Please ensure the template file exists."
    exit 1
fi

# Determine project ID from environment or gcloud
if [[ -n "$PROJECT_ID" ]]; then
    FIREBASE_PROJECT_ID="$PROJECT_ID"
    echo "✅ Using PROJECT_ID from environment: $FIREBASE_PROJECT_ID"
elif [[ -n "$FIREBASE_PROJECT_ID" ]]; then
    # Allow direct FIREBASE_PROJECT_ID env var as well
    echo "✅ Using FIREBASE_PROJECT_ID from environment: $FIREBASE_PROJECT_ID"
elif command -v gcloud >/dev/null 2>&1; then
    FIREBASE_PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
    if [[ -n "$FIREBASE_PROJECT_ID" ]]; then
        echo "✅ Using project from gcloud config: $FIREBASE_PROJECT_ID"
    else
        echo "⚠️  No project set in gcloud config"
        FIREBASE_PROJECT_ID=""
    fi
else
    echo "⚠️  gcloud CLI not found"
    FIREBASE_PROJECT_ID=""
fi

# If no project ID found, prompt user or show instructions
if [[ -z "$FIREBASE_PROJECT_ID" ]]; then
    echo "❌ No Firebase project ID found!"
    echo ""
    echo "Please set one of the following:"
    echo "  • Export PROJECT_ID: export PROJECT_ID=your-project-id"
    echo "  • Export FIREBASE_PROJECT_ID: export FIREBASE_PROJECT_ID=your-project-id"
    echo "  • Set gcloud default project: gcloud config set project your-project-id"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Validate project ID format (basic check)
if [[ ! "$FIREBASE_PROJECT_ID" =~ ^[a-z0-9-]+$ ]]; then
    echo "❌ Invalid project ID format: $FIREBASE_PROJECT_ID"
    echo "   Firebase project IDs should contain only lowercase letters, numbers, and hyphens."
    exit 1
fi

# Generate .firebaserc from template
echo "📝 Generating .firebaserc with project: $FIREBASE_PROJECT_ID"

# Use jq if available for proper JSON handling, otherwise use sed
if command -v jq >/dev/null 2>&1; then
    jq --arg project_id "$FIREBASE_PROJECT_ID" '.projects.default = $project_id' "$TEMPLATE_FILE" > "$OUTPUT_FILE"
else
    # Fallback to sed replacement
    sed "s/YOUR_FIREBASE_PROJECT_ID/$FIREBASE_PROJECT_ID/g" "$TEMPLATE_FILE" > "$OUTPUT_FILE"
fi

# Verify the generated file
if [[ -f "$OUTPUT_FILE" ]]; then
    echo "✅ Successfully created .firebaserc"
    echo "   Project: $FIREBASE_PROJECT_ID"
    
    # Show the generated content for verification
    echo ""
    echo "📋 Generated .firebaserc content:"
    cat "$OUTPUT_FILE"
    echo ""
    
    # Validate JSON if jq is available
    if command -v jq >/dev/null 2>&1; then
        if jq . "$OUTPUT_FILE" >/dev/null 2>&1; then
            echo "✅ JSON validation passed"
        else
            echo "❌ JSON validation failed"
            exit 1
        fi
    fi
    
    echo "🎉 Firebase configuration is ready!"
    echo "   You can now run Firebase CLI commands."
else
    echo "❌ Failed to create .firebaserc"
    exit 1
fi