<?php

declare(strict_types=1);

namespace LuknerLumina\TebraApi;

use Google\Cloud\SecretManager\V1\SecretManagerServiceClient;
use Google\Cloud\SecretManager\V1\AccessSecretVersionRequest;

/**
 * Helper class to retrieve secrets from Google Secret Manager
 */
class SecretManager {
    private static ?SecretManagerServiceClient $client = null;
    private static ?string $projectId = null;
    private static array $cache = [];
    
    /**
     * Initialize the Secret Manager client
     */
    private static function initClient(): void {
        if (self::$client === null) {
            self::$client = new SecretManagerServiceClient();
            self::$projectId = getenv('GOOGLE_CLOUD_PROJECT') ?: getenv('GCP_PROJECT_ID');
            
            if (!self::$projectId) {
                // Try to get from metadata service (works in Cloud Run)
                $metadataUrl = 'http://metadata.google.internal/computeMetadata/v1/project/project-id';
                $context = stream_context_create([
                    'http' => [
                        'header' => 'Metadata-Flavor: Google',
                        'timeout' => 2
                    ]
                ]);
                $projectId = @file_get_contents($metadataUrl, false, $context);
                if ($projectId) {
                    self::$projectId = trim($projectId);
                }
            }
            
            if (!self::$projectId) {
                throw new \RuntimeException('Unable to determine Google Cloud project ID');
            }
        }
    }
    
    /**
     * Get a secret value from Google Secret Manager
     * Falls back to environment variable if GSM fails
     */
    public static function getSecret(string $secretId, string $envFallback = null): ?string {
        // Check cache first
        if (isset(self::$cache[$secretId])) {
            return self::$cache[$secretId];
        }
        
        // Try environment variable first (for local development)
        $envKey = $envFallback ?: strtoupper(str_replace('-', '_', $secretId));
        $envValue = getenv($envKey);
        if ($envValue !== false && $envValue !== '') {
            self::$cache[$secretId] = $envValue;
            return $envValue;
        }
        
        // Try Google Secret Manager
        try {
            self::initClient();
            
            // Build the resource name
            $name = self::$client->secretVersionName(self::$projectId, $secretId, 'latest');
            
            // Create request
            $request = new AccessSecretVersionRequest();
            $request->setName($name);
            
            // Access the secret
            $response = self::$client->accessSecretVersion($request);
            $payload = $response->getPayload();
            $value = trim((string) $payload->getData());
            
            if (empty($value)) {
                throw new \RuntimeException("Secret {$secretId} is empty");
            }
            
            // Cache the value
            self::$cache[$secretId] = $value;
            
            error_log("Retrieved secret {$secretId} from GSM");
            return $value;
            
        } catch (\Exception $e) {
            error_log("Failed to retrieve secret {$secretId} from GSM: " . $e->getMessage());
            
            // If we have an environment fallback key, try it
            if ($envFallback && $envFallback !== $envKey) {
                $fallbackValue = getenv($envFallback);
                if ($fallbackValue !== false && $fallbackValue !== '') {
                    self::$cache[$secretId] = $fallbackValue;
                    return $fallbackValue;
                }
            }
            
            return null;
        }
    }
    
    /**
     * Get a required secret (throws exception if not found)
     */
    public static function getRequiredSecret(string $secretId, string $envFallback = null): string {
        $value = self::getSecret($secretId, $envFallback);
        if ($value === null || $value === '') {
            throw new \RuntimeException("Required secret {$secretId} not found");
        }
        return $value;
    }
    
    /**
     * Close the client connection
     */
    public static function close(): void {
        if (self::$client !== null) {
            self::$client->close();
            self::$client = null;
        }
    }
}