<?php
/**
 * Tebra API Configuration
 * Handles environment variables and credentials
 */

function getTebraConfig() {
    // Try to get from environment variables first
    $config = [
        'wsdl_url' => getenv('TEBRA_WSDL_URL') ?: getenv('REACT_APP_TEBRA_WSDL_URL'),
        'username' => getenv('TEBRA_USERNAME') ?: getenv('REACT_APP_TEBRA_USERNAME'),
        'password' => getenv('TEBRA_PASSWORD') ?: getenv('REACT_APP_TEBRA_PASSWORD'),
        'customer_key' => getenv('TEBRA_CUSTOMER_KEY') ?: getenv('REACT_APP_TEBRA_CUSTOMER_KEY')
    ];
    
    // Fallback to hardcoded values for development (replace with your actual values)
    if (!$config['wsdl_url']) {
        $config['wsdl_url'] = 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl';
    }
    
    if (!$config['username']) {
        $config['username'] = 'ZEp7U8-VeHuza@luknerclinic.com';
    }
    
    // Password should be provided via environment or Google Secret Manager
    if (!$config['password']) {
        // Try to get from Google Secret Manager if available
        $config['password'] = getSecretFromGSM('tebra-password') ?: '';
    }
    
    if (!$config['customer_key']) {
        // Try to get from Google Secret Manager if available
        $config['customer_key'] = getSecretFromGSM('tebra-customer-key') ?: '';
    }
    
    // Validate required fields
    $requiredFields = ['wsdl_url', 'username', 'password'];
    foreach ($requiredFields as $field) {
        if (empty($config[$field])) {
            throw new Exception("Missing required Tebra configuration: $field");
        }
    }
    
    // Build WSDL URL with customer key if available
    if ($config['customer_key']) {
        $config['wsdl_url'] = addCustomerKeyToWsdl($config['wsdl_url'], $config['customer_key']);
    }
    
    return $config;
}

/**
 * Get secret from Google Secret Manager
 */
function getSecretFromGSM($secretName) {
    try {
        // Use gcloud command to get secret
        $command = "gcloud secrets versions access latest --secret=$secretName --project=luknerlumina-firebase 2>/dev/null";
        $output = shell_exec($command);
        return trim($output);
    } catch (Exception $e) {
        error_log("Failed to get secret from GSM: " . $e->getMessage());
        return null;
    }
}

/**
 * Add customer key to WSDL URL
 */
function addCustomerKeyToWsdl($wsdlUrl, $customerKey) {
    if (strpos($wsdlUrl, 'customerkey=') !== false) {
        return $wsdlUrl; // Already has customer key
    }
    
    $separator = strpos($wsdlUrl, '?') !== false ? '&' : '?';
    return $wsdlUrl . $separator . 'customerkey=' . urlencode($customerKey);
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function validateDate($date) {
    $d = DateTime::createFromFormat('Y-m-d', $date);
    return $d && $d->format('Y-m-d') === $date;
}

/**
 * Get environment variable with fallback
 */
function getEnvVar($key, $default = null) {
    $value = getenv($key);
    return $value !== false ? $value : $default;
}

?>