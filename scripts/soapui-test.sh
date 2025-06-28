#!/bin/bash

# SoapUI Test Runner with Secret Management
# This script injects secrets into SoapUI project file for testing and removes them when done

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SOAPUI_PROJECT="$PROJECT_ROOT/soapui/Tebra-EHR-soapui-project.xml"
SOAPUI_PROJECT_TEMP="$PROJECT_ROOT/soapui/Tebra-EHR-soapui-project-temp.xml"

# Function to load secrets from .env file
load_secrets() {
    if [ -f "$PROJECT_ROOT/.env" ]; then
        # Extract Tebra credentials from .env file
        export TEBRA_USERNAME=$(grep VITE_TEBRA_USERNAME "$PROJECT_ROOT/.env" | cut -d '=' -f2)
        export TEBRA_PASSWORD=$(grep VITE_TEBRA_PASSWORD "$PROJECT_ROOT/.env" | cut -d '=' -f2)
        export TEBRA_CUSTOMER_KEY=$(grep -E "VITE_TEBRA_CUSTOMER_KEY|REACT_APP_TEBRA_CUSTOMERKEY" "$PROJECT_ROOT/.env" | head -1 | cut -d '=' -f2 || echo "j57wt68dc39q")
        
        if [ -z "$TEBRA_USERNAME" ] || [ -z "$TEBRA_PASSWORD" ]; then
            echo -e "${RED}Error: Missing Tebra credentials in .env file${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Error: .env file not found${NC}"
        exit 1
    fi
}

# Function to inject secrets into SoapUI project
inject_secrets() {
    echo -e "${YELLOW}Injecting secrets into SoapUI project...${NC}"
    
    # Create temporary file with injected secrets
    cp "$SOAPUI_PROJECT" "$SOAPUI_PROJECT_TEMP"
    
    # Replace placeholders with actual values
    sed -i '' "s/\${TEBRA_USERNAME}/$TEBRA_USERNAME/g" "$SOAPUI_PROJECT_TEMP"
    sed -i '' "s/\${TEBRA_PASSWORD}/$TEBRA_PASSWORD/g" "$SOAPUI_PROJECT_TEMP"
    sed -i '' "s/\${TEBRA_CUSTOMER_KEY}/$TEBRA_CUSTOMER_KEY/g" "$SOAPUI_PROJECT_TEMP"
    
    echo -e "${GREEN}Secrets injected successfully${NC}"
}

# Function to clean up temporary files
cleanup() {
    echo -e "${YELLOW}Cleaning up temporary files...${NC}"
    
    if [ -f "$SOAPUI_PROJECT_TEMP" ]; then
        rm -f "$SOAPUI_PROJECT_TEMP"
        echo -e "${GREEN}Temporary files removed${NC}"
    fi
    
    # Clear environment variables
    unset TEBRA_USERNAME
    unset TEBRA_PASSWORD
    unset TEBRA_CUSTOMER_KEY
}

# Function to run SoapUI tests
run_soapui_tests() {
    echo -e "${YELLOW}Running SoapUI tests...${NC}"
    
    # Check if SoapUI is installed
    if ! command -v soapui &> /dev/null; then
        echo -e "${RED}Error: SoapUI is not installed or not in PATH${NC}"
        echo "Please install SoapUI from: https://www.soapui.org/downloads/soapui/"
        return 1
    fi
    
    # Run SoapUI with the temporary project file
    soapui "$SOAPUI_PROJECT_TEMP"
}

# Main execution
main() {
    echo -e "${GREEN}=== SoapUI Test Runner ===${NC}"
    echo ""
    
    # Set up trap to ensure cleanup runs even if script fails
    trap cleanup EXIT
    
    # Load secrets from .env
    load_secrets
    
    # Inject secrets into temporary project file
    inject_secrets
    
    # Run SoapUI tests
    run_soapui_tests
    
    echo ""
    echo -e "${GREEN}Testing completed!${NC}"
}

# Run main function
main "$@"