# Tebra PHP API - Cloud Run Hybrid Architecture Design

## Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌─────────────┐
│  React App  │────▶│ Firebase Function│────▶│ Cloud Run (PHP) │────▶│  Tebra API  │
│  (Frontend) │     │   (Auth/Logic)   │     │  (SOAP Bridge)  │     │   (SOAP)    │
└─────────────┘     └──────────────────┘     └─────────────────┘     └─────────────┘
      │                      │                         │
      │                      ▼                         ▼
      │              ┌─────────────┐           ┌──────────────┐
      └─────────────▶│  Firestore  │           │Secret Manager│
                     └─────────────┘           └──────────────┘
```

## Component Details

### 1. Frontend (React App)
- Calls Firebase Functions (not Cloud Run directly)
- Uses Firebase Auth for user authentication
- Handles UI/UX for appointment scheduling, provider management

### 2. Firebase Functions (Node.js)
- **Authentication**: Validates Firebase Auth tokens
- **Authorization**: Checks user permissions
- **Business Logic**: Data validation, transformations
- **Proxy Calls**: Routes requests to Cloud Run PHP service
- **Caching**: Implements caching for frequently accessed data
- **Rate Limiting**: Prevents API abuse

### 3. Cloud Run PHP Service
- **Single Responsibility**: SOAP communication with Tebra
- **Stateless**: No session management
- **Credentials**: Fetches from Secret Manager
- **Transformation**: Converts JSON ↔ SOAP/XML

### 4. Security Layers
- **Firebase Auth**: User authentication
- **Service Account**: Cloud Run → Secret Manager
- **API Key**: Internal auth between Firebase → Cloud Run
- **HTTPS**: All communication encrypted

## Detailed Implementation

### Project Structure
```
lukner-tebra-integration/
├── frontend/                 # Existing React app
├── functions/               # Firebase Functions
│   ├── src/
│   │   ├── index.ts
│   │   ├── tebra/
│   │   │   ├── providers.ts
│   │   │   ├── appointments.ts
│   │   │   └── client.ts
│   │   └── middleware/
│   │       ├── auth.ts
│   │       └── rateLimit.ts
│   └── package.json
└── tebra-php-service/       # New Cloud Run service
    ├── src/
    │   ├── TebraHttpClient.php
    │   ├── Auth/
    │   │   └── TokenValidator.php
    │   └── Handlers/
    │       ├── ProvidersHandler.php
    │       └── AppointmentsHandler.php
    ├── public/
    │   └── index.php
    ├── Dockerfile
    ├── composer.json
    └── .env.yaml
```

## Cloud Run PHP Service Implementation

### Dockerfile
```dockerfile
FROM php:8.2-apache

# Install required extensions and tools
RUN apt-get update && apt-get install -y \
    libxml2-dev \
    libcurl4-openssl-dev \
    zip \
    unzip \
    && docker-php-ext-install soap curl \
    && pecl install apcu \
    && docker-php-ext-enable apcu \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Configure Apache
RUN a2enmod rewrite headers
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

# Set working directory
WORKDIR /var/www

# Copy application files
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts

COPY . .
RUN composer dump-autoload --optimize

# Set permissions
RUN chown -R www-data:www-data /var/www

# Cloud Run port configuration
RUN sed -i 's/80/${PORT}/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

EXPOSE 8080
```

### docker/apache.conf
```apache
<VirtualHost *:${PORT}>
    DocumentRoot /var/www/public
    
    <Directory /var/www/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Rewrite rules
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.php [L]
    </Directory>
    
    # Security headers
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

### composer.json
```json
{
    "name": "lukner-clinic/tebra-php-service",
    "description": "PHP SOAP bridge for Tebra API",
    "type": "project",
    "require": {
        "php": "^8.2",
        "ext-soap": "*",
        "ext-curl": "*",
        "ext-apcu": "*",
        "google/cloud-secret-manager": "^1.12",
        "firebase/php-jwt": "^6.8",
        "monolog/monolog": "^3.0",
        "guzzlehttp/guzzle": "^7.5"
    },
    "autoload": {
        "psr-4": {
            "TebraService\\": "src/"
        }
    },
    "config": {
        "optimize-autoloader": true,
        "sort-packages": true
    }
}
```

### public/index.php
```php
<?php
require_once __DIR__ . '/../vendor/autoload.php';

use TebraService\Auth\TokenValidator;
use TebraService\Handlers\ProvidersHandler;
use TebraService\Handlers\AppointmentsHandler;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

// Initialize logger
$logger = new Logger('tebra-service');
$logger->pushHandler(new StreamHandler('php://stdout', Logger::INFO));

// CORS configuration
$allowedOrigins = [
    'https://your-app.web.app',
    'https://your-app.firebaseapp.com'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Validate internal API key
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
$expectedKey = getenv('INTERNAL_API_KEY');

if (!hash_equals($expectedKey, $apiKey)) {
    $logger->warning('Invalid API key attempt', ['ip' => $_SERVER['REMOTE_ADDR']]);
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Validate Firebase token (optional extra security)
try {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        $validator = new TokenValidator();
        $userId = $validator->validate($token);
        $logger->info('Request authenticated', ['userId' => $userId]);
    }
} catch (Exception $e) {
    $logger->error('Auth validation failed', ['error' => $e->getMessage()]);
}

// Route request
try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input');
    }
    
    $action = $input['action'] ?? '';
    $params = $input['params'] ?? [];
    
    $logger->info('Processing request', ['action' => $action]);
    
    switch ($action) {
        case 'providers.list':
            $handler = new ProvidersHandler($logger);
            $result = $handler->getProviders($params);
            break;
            
        case 'appointments.list':
            $handler = new AppointmentsHandler($logger);
            $result = $handler->getAppointments($params);
            break;
            
        case 'appointments.create':
            $handler = new AppointmentsHandler($logger);
            $result = $handler->createAppointment($params);
            break;
            
        default:
            throw new Exception("Unknown action: $action");
    }
    
    echo json_encode([
        'success' => true,
        'data' => $result,
        'timestamp' => time()
    ]);
    
} catch (Exception $e) {
    $logger->error('Request failed', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
```

### src/TebraHttpClient.php (Enhanced)
```php
<?php
namespace TebraService;

use Google\Cloud\SecretManager\V1\SecretManagerServiceClient;
use Monolog\Logger;

class TebraHttpClient {
    private string $baseUrl;
    private string $username;
    private string $password;
    private Logger $logger;
    private $cache;
    
    public function __construct(Logger $logger) {
        $this->logger = $logger;
        $this->loadCredentials();
        $this->cache = apcu_enabled() ? new ApcuCache() : new NullCache();
    }
    
    private function loadCredentials(): void {
        // Try Secret Manager first
        try {
            $client = new SecretManagerServiceClient();
            $projectId = getenv('GOOGLE_CLOUD_PROJECT');
            
            $this->baseUrl = $this->getSecret($client, $projectId, 'tebra-wsdl-url');
            $this->username = $this->getSecret($client, $projectId, 'tebra-username');
            $this->password = $this->getSecret($client, $projectId, 'tebra-password');
            
            $this->logger->info('Credentials loaded from Secret Manager');
        } catch (\Exception $e) {
            // Fallback to environment variables
            $this->logger->warning('Failed to load from Secret Manager, using env vars');
            $this->baseUrl = getenv('TEBRA_WSDL_URL');
            $this->username = getenv('TEBRA_USERNAME');
            $this->password = getenv('TEBRA_PASSWORD');
        }
    }
    
    private function getSecret($client, $projectId, $secretId): string {
        $name = $client->secretVersionName($projectId, $secretId, 'latest');
        $response = $client->accessSecretVersion($name);
        return $response->getPayload()->getData();
    }
    
    public function callSoapMethod(string $action, string $soapBody): array {
        // Check cache first
        $cacheKey = md5($action . $soapBody);
        $cached = $this->cache->get($cacheKey);
        if ($cached !== false) {
            $this->logger->info('Cache hit', ['action' => $action]);
            return $cached;
        }
        
        $startTime = microtime(true);
        
        // Build SOAP envelope
        $soapEnvelope = $this->buildSoapEnvelope($soapBody);
        
        // Make request
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->baseUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $soapEnvelope,
            CURLOPT_HTTPHEADER => [
                'Content-Type: text/xml; charset=utf-8',
                'SOAPAction: "http://www.kareo.com/api/schemas/KareoServices/' . $action . '"',
                'Content-Length: ' . strlen($soapEnvelope)
            ],
            CURLOPT_USERPWD => $this->username . ':' . $this->password,
            CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        $duration = round((microtime(true) - $startTime) * 1000, 2);
        
        $this->logger->info('SOAP request completed', [
            'action' => $action,
            'httpCode' => $httpCode,
            'duration' => $duration . 'ms'
        ]);
        
        if ($error) {
            throw new \Exception("CURL error: $error");
        }
        
        if ($httpCode !== 200) {
            throw new \Exception("HTTP error: $httpCode");
        }
        
        $result = $this->parseSoapResponse($response);
        
        // Cache successful responses
        $this->cache->set($cacheKey, $result, 300); // 5 minutes
        
        return $result;
    }
    
    private function buildSoapEnvelope(string $body): string {
        return '<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:kar="http://www.kareo.com/api/schemas/">
    <soap:Header/>
    <soap:Body>
        ' . $body . '
    </soap:Body>
</soap:Envelope>';
    }
    
    private function parseSoapResponse(string $xml): array {
        // Remove namespaces for easier parsing
        $xml = preg_replace('/xmlns[^=]*="[^"]*"/i', '', $xml);
        $xml = preg_replace('/[a-zA-Z0-9]+:([a-zA-Z0-9]+)/', '$1', $xml);
        
        $doc = new \DOMDocument();
        if (!$doc->loadXML($xml)) {
            throw new \Exception('Failed to parse SOAP response');
        }
        
        // Convert to array
        return $this->domToArray($doc->documentElement);
    }
    
    private function domToArray(\DOMNode $node): array {
        $output = [];
        
        switch ($node->nodeType) {
            case XML_CDATA_SECTION_NODE:
            case XML_TEXT_NODE:
                $output = trim($node->textContent);
                break;
                
            case XML_ELEMENT_NODE:
                for ($i = 0; $i < $node->childNodes->length; $i++) {
                    $child = $node->childNodes->item($i);
                    $v = $this->domToArray($child);
                    
                    if (isset($child->tagName)) {
                        $t = $child->tagName;
                        
                        if (!isset($output[$t])) {
                            $output[$t] = [];
                        }
                        $output[$t][] = $v;
                    } elseif ($v || $v === '0') {
                        $output = (string) $v;
                    }
                }
                
                if ($node->attributes->length && !is_array($output)) {
                    $output = ['@content' => $output];
                }
                
                if (is_array($output)) {
                    foreach ($output as $t => $v) {
                        if (is_array($v) && count($v) == 1 && $t != '@attributes') {
                            $output[$t] = $v[0];
                        }
                    }
                    
                    if (empty($output)) {
                        $output = '';
                    }
                }
                break;
        }
        
        return $output;
    }
}
```

## Firebase Functions Implementation

### functions/src/tebra/client.ts
```typescript
import { config } from 'firebase-functions';
import axios, { AxiosInstance } from 'axios';
import { logger } from 'firebase-functions';

export class TebraCloudRunClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = config().tebra.internal_api_key;
    const baseURL = config().tebra.cloud_run_url || 'https://tebra-php-api-xxxxx-uc.a.run.app';

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      }
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info('Tebra API request', {
          action: config.data?.action,
          params: Object.keys(config.data?.params || {})
        });
        return config;
      },
      (error) => {
        logger.error('Tebra API request error', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.info('Tebra API response', {
          success: response.data?.success,
          dataKeys: Object.keys(response.data?.data || {})
        });
        return response;
      },
      (error) => {
        logger.error('Tebra API response error', {
          status: error.response?.status,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  async callAction(action: string, params: any, userToken?: string): Promise<any> {
    try {
      const headers: any = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }

      const response = await this.client.post('/', {
        action,
        params
      }, { headers });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Unknown error');
      }

      return response.data.data;
    } catch (error: any) {
      // Enhanced error handling
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (error.response?.status === 401) {
        throw new Error('Authentication failed.');
      }
      throw error;
    }
  }
}
```

### functions/src/tebra/providers.ts
```typescript
import * as functions from 'firebase-functions';
import { TebraCloudRunClient } from './client';
import { validateAuth } from '../middleware/auth';
import { checkRateLimit } from '../middleware/rateLimit';

const client = new TebraCloudRunClient();

export const getProviders = functions.https.onCall(async (data, context) => {
  // Validate authentication
  const userId = validateAuth(context);
  
  // Check rate limit
  await checkRateLimit(userId, 'getProviders', 100); // 100 calls per hour
  
  try {
    // Validate input
    const { practiceId, active = true, includeSchedule = false } = data;
    
    if (!practiceId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Practice ID is required'
      );
    }
    
    // Call Cloud Run service
    const providers = await client.callAction('providers.list', {
      practiceId,
      active,
      includeSchedule
    }, context.auth?.token);
    
    // Transform response if needed
    return {
      success: true,
      providers: providers.map((p: any) => ({
        id: p.ProviderId,
        name: `${p.FirstName} ${p.LastName}`,
        specialty: p.Specialty,
        npi: p.NPI,
        active: p.Active
      }))
    };
    
  } catch (error: any) {
    functions.logger.error('Get providers error', { error, userId });
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to retrieve providers',
      error.message
    );
  }
});
```

### functions/src/middleware/auth.ts
```typescript
import { CallableContext } from 'firebase-functions/v1/https';
import * as functions from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';

export function validateAuth(context: CallableContext): string {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }
  
  // Additional permission checks can go here
  // For example, check if user has 'staff' role
  const customClaims = context.auth.token;
  if (!customClaims.staff && !customClaims.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User does not have required permissions'
    );
  }
  
  return context.auth.uid;
}
```

## Deployment Process

### 1. Deploy Cloud Run Service
```bash
# From tebra-php-service directory
cd tebra-php-service

# Build and deploy
gcloud run deploy tebra-php-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --no-allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=your-project-id" \
  --set-secrets="INTERNAL_API_KEY=tebra-internal-api-key:latest" \
  --service-account=tebra-service@your-project-id.iam.gserviceaccount.com \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=10 \
  --min-instances=0

# Get the service URL
gcloud run services describe tebra-php-api --region us-central1 --format 'value(status.url)'
```

### 2. Configure Firebase Functions
```bash
# Set configuration
firebase functions:config:set \
  tebra.cloud_run_url="https://tebra-php-api-xxxxx-uc.a.run.app" \
  tebra.internal_api_key="your-secure-api-key"

# Deploy functions
firebase deploy --only functions
```

### 3. Set up Secret Manager
```bash
# Create secrets
echo -n "https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl" | \
  gcloud secrets create tebra-wsdl-url --data-file=-

echo -n "ZEp7U8-VeHuza@luknerclinic.com" | \
  gcloud secrets create tebra-username --data-file=-

echo -n "your-password" | \
  gcloud secrets create tebra-password --data-file=-

echo -n "your-internal-api-key" | \
  gcloud secrets create tebra-internal-api-key --data-file=-

# Grant access to service account
gcloud secrets add-iam-policy-binding tebra-wsdl-url \
  --member="serviceAccount:tebra-service@your-project-id.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Monitoring & Observability

### Cloud Run Metrics
- Request count and latency
- CPU and memory usage
- Cold start frequency
- Error rate

### Custom Logging
```php
// In PHP service
$logger->info('API call', [
    'action' => $action,
    'userId' => $userId,
    'duration' => $duration,
    'cacheHit' => $cacheHit
]);
```

### Alerts Setup
```yaml
# monitoring/alerts.yaml
alertPolicy:
  displayName: "Tebra API High Error Rate"
  conditions:
    - displayName: "Error rate > 5%"
      conditionThreshold:
        filter: 'resource.type="cloud_run_revision" 
                 AND resource.labels.service_name="tebra-php-api"
                 AND metric.type="run.googleapis.com/request_count"'
        comparison: COMPARISON_GT
        thresholdValue: 0.05
        duration: 300s
```

## Cost Optimization

### Estimated Monthly Costs
- **Cloud Run**: ~$5-15 (based on usage)
  - CPU: $0.00002400/vCPU-second
  - Memory: $0.00000250/GiB-second
  - Requests: $0.40/million
- **Secret Manager**: <$1
- **Logging**: ~$2-5

### Optimization Strategies
1. **Caching**: APCu for 5-minute response caching
2. **Connection Pooling**: Reuse CURL handles
3. **Min Instances**: Set to 0 for dev, 1 for prod
4. **Memory**: 512MB is sufficient for SOAP

## Security Best Practices

1. **Defense in Depth**
   - Firebase Auth (user authentication)
   - API Key (service-to-service)
   - Cloud Run IAM (infrastructure)

2. **Secrets Management**
   - All credentials in Secret Manager
   - Rotate API keys quarterly
   - Never commit secrets to git

3. **Network Security**
   - HTTPS everywhere
   - No public Cloud Run endpoint
   - Firestore rules for data access

4. **Audit Logging**
   - All API calls logged
   - User actions tracked
   - Error monitoring enabled

## Troubleshooting Guide

### Common Issues

1. **SOAP Timeout**
   ```php
   // Increase timeout in TebraHttpClient
   CURLOPT_TIMEOUT => 60, // 60 seconds
   ```

2. **Memory Issues**
   ```bash
   # Increase Cloud Run memory
   gcloud run services update tebra-php-api --memory=1Gi
   ```

3. **Cold Start Latency**
   ```bash
   # Keep 1 instance warm
   gcloud run services update tebra-php-api --min-instances=1
   ```

This architecture provides a robust, scalable, and secure solution for integrating Tebra's SOAP API with your Firebase-based application while maintaining zero server management overhead.