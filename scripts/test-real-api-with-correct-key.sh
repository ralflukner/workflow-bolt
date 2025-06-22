#!/bin/bash
# Force the correct API key for testing
export VITE_TEBRA_PROXY_API_KEY="UlmgPDMHoMqP2KAMKGIJK4tudPlm7z7ertoJ6eTV3+Y="
export TEBRA_PROXY_API_KEY="UlmgPDMHoMqP2KAMKGIJK4tudPlm7z7ertoJ6eTV3+Y="
export RUN_REAL_API_TESTS="true"

echo "🔑 Using forced API key: ${VITE_TEBRA_PROXY_API_KEY:0:10}... (length: ${#VITE_TEBRA_PROXY_API_KEY})"

# Run the tests
npm test -- --selectProjects real-api