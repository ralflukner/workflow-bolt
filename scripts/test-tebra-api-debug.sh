#!/bin/bash

# Test Tebra API Debug Script
# This script tests the Tebra API endpoints with enhanced debugging

set -e

echo "🔍 Tebra API Debug Test Suite"
echo "============================="
echo ""

# Get today's date in Chicago timezone
TODAY=$(TZ="America/Chicago" date +%Y-%m-%d)
TOMORROW=$(TZ="America/Chicago" date -v+1d +%Y-%m-%d 2>/dev/null || TZ="America/Chicago" date -d tomorrow +%Y-%m-%d)

echo "📅 Testing dates:"
echo "   Today: $TODAY"
echo "   Tomorrow: $TOMORROW"
echo ""

# Get Firebase ID token
echo "🔐 Getting Firebase authentication token..."
ID_TOKEN=$(npm run --silent get-firebase-token 2>/dev/null || echo "")

if [ -z "$ID_TOKEN" ]; then
    echo "❌ Failed to get Firebase ID token"
    echo "   Please ensure you're logged in: npm run login"
    exit 1
fi

echo "✅ Got Firebase ID token"
echo ""

# Function URL (update if needed)
FUNCTION_URL="http://localhost:5001/luknerlumina-firebase/us-central1/api"

# Test function to make API calls
test_api_call() {
    local ACTION=$1
    local PARAMS=$2
    local DESCRIPTION=$3
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🧪 Test: $DESCRIPTION"
    echo "   Action: $ACTION"
    echo "   Params: $PARAMS"
    echo ""
    
    # Make the API call
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $ID_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"action\": \"$ACTION\", \"params\": $PARAMS}" \
        "$FUNCTION_URL/api/tebra" 2>&1)
    
    # Check if response is valid JSON
    if echo "$RESPONSE" | jq -e . >/dev/null 2>&1; then
        # Pretty print the response
        echo "📊 Response:"
        echo "$RESPONSE" | jq '.'
        
        # Extract key information
        SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
        if [ "$SUCCESS" = "true" ]; then
            echo ""
            echo "✅ Request successful"
            
            # Check metadata
            METADATA=$(echo "$RESPONSE" | jq -r '.data.metadata // empty')
            if [ ! -z "$METADATA" ]; then
                echo ""
                echo "📋 Metadata:"
                echo "$METADATA" | jq '.'
            fi
            
            # Count appointments if applicable
            if [ "$ACTION" = "getAppointments" ] || [ "$ACTION" = "syncSchedule" ]; then
                COUNT=$(echo "$RESPONSE" | jq '[.data.GetAppointmentsResult.Appointments.AppointmentData // empty] | if type == "array" then length else 1 end')
                echo ""
                echo "📊 Found $COUNT appointments"
                
                # List patient names
                PATIENTS=$(echo "$RESPONSE" | jq -r '.data.GetAppointmentsResult.Appointments.AppointmentData | if type == "array" then .[] else . end | .PatientFullName // empty' 2>/dev/null || echo "")
                if [ ! -z "$PATIENTS" ]; then
                    echo ""
                    echo "👥 Patients:"
                    echo "$PATIENTS" | sed 's/^/   - /'
                fi
            fi
        else
            echo ""
            echo "❌ Request failed"
            ERROR=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
            echo "   Error: $ERROR"
            
            # Show debug info if available
            DEBUG_INFO=$(echo "$RESPONSE" | jq -r '._debug // empty')
            if [ ! -z "$DEBUG_INFO" ]; then
                echo ""
                echo "🐛 Debug info:"
                echo "$DEBUG_INFO" | jq '.'
            fi
        fi
    else
        echo "❌ Invalid JSON response:"
        echo "$RESPONSE"
    fi
    
    echo ""
}

# Run tests
echo "🚀 Starting Tebra API tests..."
echo ""

# Test 1: Test connection
test_api_call "testConnection" "{}" "Test Tebra connection"

# Test 2: Get providers
test_api_call "getProviders" "{}" "Get all providers"

# Test 3: Get today's appointments (with debug mode)
test_api_call "getAppointments" "{\"fromDate\": \"$TODAY\", \"toDate\": \"$TODAY\", \"debug\": true}" "Get today's appointments (debug mode)"

# Test 4: Force real API call for today
echo "⚡ Forcing real API call (bypassing rate limit)..."
test_api_call "getAppointments" "{\"fromDate\": \"$TODAY\", \"toDate\": \"$TODAY\", \"forceReal\": true, \"debug\": true}" "Get today's appointments (force real API)"

# Test 5: Sync schedule for today
test_api_call "syncSchedule" "{\"date\": \"$TODAY\"}" "Sync today's schedule"

# Test 6: Get tomorrow's appointments
test_api_call "getAppointments" "{\"fromDate\": \"$TOMORROW\", \"toDate\": \"$TOMORROW\"}" "Get tomorrow's appointments"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ All tests completed"
echo ""
echo "💡 Troubleshooting tips:"
echo "   1. Check if the API is returning hardcoded data (source: 'hardcoded_fallback')"
echo "   2. Look for rate limit information in metadata"
echo "   3. Use forceReal=true to bypass rate limiting"
echo "   4. Check Cloud Run logs: gcloud run logs read --service=tebra-php-api --project=luknerlumina-firebase"
echo "   5. Check Firebase logs: firebase functions:log --only exchangeAuth0Token"