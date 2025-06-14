#!/bin/bash

# Check if API key is set in environment
if [ -z "$TEBRA_API_KEY" ]; then
    echo "Error: TEBRA_API_KEY environment variable is not set"
    echo "Please set it using: export TEBRA_API_KEY='your-api-key'"
    exit 1
fi

# Run the PHP test script with the API key from environment
php test-http-connection.php