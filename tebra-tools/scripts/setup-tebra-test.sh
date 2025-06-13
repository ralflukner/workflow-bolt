#!/usr/bin/env bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
TOOLS_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Tebra Test Setup ==="

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
    echo "❌ test-tebra.php not found in tebra-tools directory ($TOOLS_ROOT)"
    exit 1
fi

echo "✓ Environment check passed"
echo
echo "To test Tebra integration:"
echo "1. Ensure you have access to Tebra credentials in GSM"
echo "2. Run: $TOOLS_ROOT/scripts/security-check-gsm.sh"
echo "3. Run: php $TOOLS_ROOT/test-tebra.php   # or php $TOOLS_ROOT/test-tebra-env.php"
echo
echo "To rotate credentials:"
echo "1. Run: $TOOLS_ROOT/scripts/rotate-username-password.sh"
echo "2. Follow the prompts to update credentials"
echo
echo "For more information, see:"
echo "- $TOOLS_ROOT/README.md"
echo "- docs/TEBRA_DEBUGGING_RESOLUTION.md" 