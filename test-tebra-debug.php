<?php
/**
 * Tebra API Debug Utility
 * --------------------------------------
 * This script uses the shared TebraHttpClient (src/TebraHttpClient.php)
 * to perform quick smoke-tests against the live SOAP API.
 *
 * Usage (CLI):
 *   php test-tebra-debug.php [command]
 *
 * Commands:
 *   health           – just print health status & recent logs (default)
 *   connection       – run client->testConnection()
 *   providers        – fetch providers list
 *   appointments     – fetch today's appointments
 *
 * Environment / Secret Manager credentials are picked up automatically
 * by TebraHttpClient, so no creds in this file.
 */

// Try root composer autoload first
@require_once __DIR__ . '/vendor/autoload.php';

// If class still missing, try autoload from tebra-php-api sub-package
if (!class_exists('LuknerLumina\\TebraApi\\TebraHttpClient')) {
    $tebraAutoload = __DIR__ . '/tebra-php-api/vendor/autoload.php';
    if (file_exists($tebraAutoload)) {
        require_once $tebraAutoload;
    }
}

// Final fallback: direct include (works even without composer install inside tebra-php-api)
if (!class_exists('LuknerLumina\\TebraApi\\TebraHttpClient')) {
    require_once __DIR__ . '/tebra-php-api/src/TebraHttpClient.php';
}

use LuknerLumina\TebraApi\TebraHttpClient;

$command = $argv[1] ?? 'health';

$client = null;

try {
    $client = new TebraHttpClient();
} catch (Exception $e) {
    echo "❌ Failed to instantiate TebraHttpClient: " . $e->getMessage() . PHP_EOL;
    exit(1);
}

switch ($command) {
    case 'connection':
        echo "\n🔍 Running connection test…" . PHP_EOL;
        $result = $client->testConnection();
        print_r($result);
        break;

    case 'providers':
        echo "\n🔍 Fetching providers…" . PHP_EOL;
        $result = $client->getProviders();
        print_r($result);
        break;

    case 'appointments':
        echo "\n🔍 Fetching today's appointments…" . PHP_EOL;
        $today = date('n/j/Y');
        $result = $client->getAppointments($today, $today);
        print_r($result);
        break;

    case 'health':
    default:
        echo "\n🔍 Client health status…" . PHP_EOL;
        $health = $client->getHealthStatus();
        print_r($health);
        break;
}

echo "\n🏁 Debug script completed." . PHP_EOL;
?> 