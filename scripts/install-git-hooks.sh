#!/opt/homebrew/bin/bash

# Script to install git hooks for the project

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Installing git hooks...${NC}"

# Get the project root directory
ROOT_DIR=$(git rev-parse --show-toplevel)

# Create hooks directory if it doesn't exist
HOOKS_DIR="$ROOT_DIR/.git/hooks"
mkdir -p "$HOOKS_DIR"

# Create pre-commit hook
PRE_COMMIT="$HOOKS_DIR/pre-commit"
echo -e "${YELLOW}Creating pre-commit hook...${NC}"

cat > "$PRE_COMMIT" << 'EOF'
#!/bin/bash

# Pre-commit hook to check for secrets in staged files
# This hook will run the check-staged-for-secrets.sh script

# Path to the script
SCRIPT_PATH="$(git rev-parse --show-toplevel)/scripts/check-staged-for-secrets.sh"

# Check if the script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "Error: check-staged-for-secrets.sh script not found at $SCRIPT_PATH"
    exit 1
fi

# Run the script
"$SCRIPT_PATH"

# Exit with the same status as the script
exit $?
EOF

# Make the hook executable
chmod +x "$PRE_COMMIT"

echo -e "${GREEN}Git hooks installed successfully!${NC}"
echo -e "${YELLOW}The pre-commit hook will now run automatically before each commit.${NC}"