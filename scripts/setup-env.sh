#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check if a file exists
file_exists() {
  [ -f "$1" ]
}

# Function to create .env.local file
create_env_file() {
  echo -e "${YELLOW}Creating .env.local file...${NC}"
  
  cat > .env.local << EOL
# Tebra API Configuration
VITE_TEBRA_WSDL_URL="https://api.tebra.com/wsdl"
VITE_TEBRA_USERNAME="your-username"
VITE_TEBRA_PASSWORD="your-password"
VITE_TEBRA_CUSTOMER_KEY="your-customer-key"

# Firebase Configuration
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"

# Auth0 Configuration
VITE_AUTH0_DOMAIN="your-tenant.auth0.com"
VITE_AUTH0_CLIENT_ID="your-client-id"
VITE_AUTH0_AUDIENCE="your-api-identifier"
EOL

  echo -e "${GREEN}Created .env.local file. Please update the values with your actual credentials.${NC}"
}

# Function to check Node.js version
check_node_version() {
  if ! command_exists node; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18 or higher.${NC}"
    exit 1
  fi

  NODE_VERSION=$(node -v | cut -d'v' -f2)
  NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

  if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js version $NODE_VERSION is not supported. Please install Node.js 18 or higher.${NC}"
    exit 1
  fi

  echo -e "${GREEN}Node.js version $NODE_VERSION is supported.${NC}"
}

# Function to check npm version
check_npm_version() {
  if ! command_exists npm; then
    echo -e "${RED}npm is not installed. Please install npm.${NC}"
    exit 1
  fi

  NPM_VERSION=$(npm -v)
  echo -e "${GREEN}npm version $NPM_VERSION is installed.${NC}"
}

# Function to install dependencies
install_dependencies() {
  echo -e "${YELLOW}Installing dependencies...${NC}"
  
  if ! npm install; then
    echo -e "${RED}Failed to install dependencies.${NC}"
    exit 1
  fi

  echo -e "${GREEN}Dependencies installed successfully.${NC}"
}

# Main script
echo -e "${YELLOW}Starting environment setup...${NC}"

# Check Node.js version
check_node_version

# Check npm version
check_npm_version

# Create .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
  create_env_file
else
  echo -e "${YELLOW}.env.local file already exists.${NC}"
fi

# Install dependencies
install_dependencies

echo -e "${GREEN}Environment setup completed successfully!${NC}"
echo -e "${YELLOW}Please update the .env.local file with your actual credentials before running the application.${NC}" 