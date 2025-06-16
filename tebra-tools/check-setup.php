<?php
/**
 * Diagnostic script to validate prerequisites for the Tebra test scripts.
 */

echo "=== Tebra Test Setup Diagnostics ===\n\n";

// PHP version
printf("PHP Version: %s\n", PHP_VERSION);

// SOAP extension
printf("SOAP Extension Loaded: %s\n", extension_loaded('soap') ? 'Yes' : 'No');

// Composer autoload
$autoloadPath = __DIR__ . '/vendor/autoload.php';
printf("Composer Autoload Present: %s\n", file_exists($autoloadPath) ? 'Yes' : 'No');

// Google Secret Manager client class availability
$gsmAvailable = class_exists('Google\\Cloud\\SecretManager\\V1\\SecretManagerServiceClient');
printf("google/cloud-secret-manager Installed: %s\n", $gsmAvailable ? 'Yes' : 'No');

// Environment variables
printf("GOOGLE_CLOUD_PROJECT Set: %s\n", getenv('GOOGLE_CLOUD_PROJECT') ? 'Yes' : 'No');
printf("TEBRA_USERNAME Set: %s\n", getenv('TEBRA_USERNAME') ? 'Yes' : 'No');
printf("TEBRA_PASSWORD Set: %s\n", getenv('TEBRA_PASSWORD') ? 'Yes' : 'No');
printf("TEBRA_CUSTOMER_KEY Set: %s\n", getenv('TEBRA_CUSTOMER_KEY') ? 'Yes' : 'No');

echo "\nDiagnostics complete.\n"; 