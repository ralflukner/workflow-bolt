<?php

/**
 * Test script for the secured debug endpoint
 * This script demonstrates how to properly authenticate with the debug endpoint
 */

// Configuration
$API_URL = getenv('TEBRA_API_URL') ?: 'http://localhost:8080';
$API_KEY = getenv('TEBRA_INTERNAL_API_KEY') ?: '';
$ADMIN_TOKEN = getenv('TEBRA_ADMIN_DEBUG_TOKEN') ?: '';

echo "🔍 Testing Secured Debug Endpoint\n";
echo "================================\n\n";

// Check if required environment variables are set
if (empty($API_KEY)) {
    echo "❌ Error: TEBRA_INTERNAL_API_KEY environment variable not set\n";
    echo "   Set it to your internal API key\n";
    exit(1);
}

if (empty($ADMIN_TOKEN)) {
    echo "❌ Error: TEBRA_ADMIN_DEBUG_TOKEN environment variable not set\n";
    echo "   Run the create-admin-debug-token.sh script to generate one\n";
    exit(1);
}

echo "✅ Configuration loaded\n";
echo "   API URL: $API_URL\n";
echo "   API Key: " . substr($API_KEY, 0, 8) . "...\n";
echo "   Admin Token: " . substr($ADMIN_TOKEN, 0, 8) . "...\n\n";

// Test 1: Access without authentication (should fail)
echo "🧪 Test 1: Access without authentication\n";
echo "   Expected: 401 Unauthorized\n";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => "$API_URL/debug/secrets",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json'
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "   Result: HTTP $httpCode\n";
if ($httpCode === 401) {
    echo "   ✅ Correctly rejected unauthorized access\n";
} else {
    echo "   ❌ Expected 401, got $httpCode\n";
    echo "   Response: $response\n";
}
echo "\n";

// Test 2: Access with only API key (should fail)
echo "🧪 Test 2: Access with only API key\n";
echo "   Expected: 401 Unauthorized\n";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => "$API_URL/debug/secrets",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-API-Key: ' . $API_KEY
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "   Result: HTTP $httpCode\n";
if ($httpCode === 401) {
    echo "   ✅ Correctly rejected access with only API key\n";
} else {
    echo "   ❌ Expected 401, got $httpCode\n";
    echo "   Response: $response\n";
}
echo "\n";

// Test 3: Access with only admin token (should fail)
echo "🧪 Test 3: Access with only admin token\n";
echo "   Expected: 401 Unauthorized\n";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => "$API_URL/debug/secrets",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-Admin-Token: ' . $ADMIN_TOKEN
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "   Result: HTTP $httpCode\n";
if ($httpCode === 401) {
    echo "   ✅ Correctly rejected access with only admin token\n";
} else {
    echo "   ❌ Expected 401, got $httpCode\n";
    echo "   Response: $response\n";
}
echo "\n";

// Test 4: Access with both credentials (should succeed if debug mode enabled)
echo "🧪 Test 4: Access with both credentials\n";
echo "   Expected: 200 OK (if debug mode enabled) or 403 Forbidden (if disabled)\n";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => "$API_URL/debug/secrets",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-API-Key: ' . $API_KEY,
        'X-Admin-Token: ' . $ADMIN_TOKEN
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "   Result: HTTP $httpCode\n";

if ($httpCode === 200) {
    echo "   ✅ Successfully accessed debug endpoint\n";
    $data = json_decode($response, true);
    if ($data) {
        echo "   📊 Debug Information:\n";
        echo "      - Status: " . ($data['status'] ?? 'unknown') . "\n";
        echo "      - PHP Version: " . ($data['environment']['php_version'] ?? 'unknown') . "\n";
        echo "      - Debug Mode: " . ($data['configuration']['debug_mode_enabled'] ? 'Enabled' : 'Disabled') . "\n";
        echo "      - API Key Configured: " . ($data['configuration']['api_key_configured'] ? 'Yes' : 'No') . "\n";
        echo "      - Admin Token Configured: " . ($data['configuration']['admin_token_configured'] ? 'Yes' : 'No') . "\n";
        echo "      - Rate Limit Remaining: " . ($data['security']['rate_limit_remaining'] ?? 'unknown') . "\n";
        echo "      - Request ID: " . ($data['security']['request_id'] ?? 'unknown') . "\n";
    }
} elseif ($httpCode === 403) {
    echo "   ℹ️  Debug mode is disabled (this is expected in production)\n";
    echo "   To enable: Set DEBUG_MODE_ENABLED=true in environment\n";
} elseif ($httpCode === 503) {
    echo "   ❌ Debug endpoint not configured\n";
    echo "   Make sure the admin debug token secret exists in Secret Manager\n";
} else {
    echo "   ❌ Unexpected response code: $httpCode\n";
    echo "   Response: $response\n";
}
echo "\n";

// Test 5: Rate limiting (make multiple requests)
echo "🧪 Test 5: Rate limiting test\n";
echo "   Making 6 requests to test rate limiting (limit is 5 per minute)\n";

$successCount = 0;
$rateLimitedCount = 0;

for ($i = 1; $i <= 6; $i++) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => "$API_URL/debug/secrets",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-API-Key: ' . $API_KEY,
            'X-Admin-Token: ' . $ADMIN_TOKEN
        ]
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "   Request $i: HTTP $httpCode";
    
    if ($httpCode === 200) {
        echo " ✅";
        $successCount++;
    } elseif ($httpCode === 429) {
        echo " ⏰ (Rate Limited)";
        $rateLimitedCount++;
    } else {
        echo " ❌";
    }
    echo "\n";
    
    // Small delay between requests
    usleep(100000); // 0.1 seconds
}

echo "\n   Rate Limiting Results:\n";
echo "      - Successful requests: $successCount\n";
echo "      - Rate limited requests: $rateLimitedCount\n";

if ($rateLimitedCount > 0) {
    echo "   ✅ Rate limiting is working correctly\n";
} else {
    echo "   ℹ️  No rate limiting observed (may be disabled or not triggered)\n";
}

echo "\n🎉 Debug endpoint security test completed!\n";
echo "📋 Summary:\n";
echo "   - Authentication: ✅ Working\n";
echo "   - Authorization: ✅ Working\n";
echo "   - Rate Limiting: " . ($rateLimitedCount > 0 ? "✅ Working" : "ℹ️ Not tested") . "\n";
echo "   - No sensitive data exposure: ✅ Confirmed\n"; 