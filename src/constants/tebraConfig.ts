/**
 * Tebra Debug Dashboard Configuration
 * Extracted constants from existing dashboard implementation
 */

// Health check intervals and timeouts
export const HEALTH_CHECK_CONFIG = {
  AUTO_REFRESH_INTERVAL: 10000, // 10 seconds (current production value)
  REQUEST_TIMEOUT: 10000, // 10 seconds
  SOAP_TIMEOUT: 15000, // 15 seconds for SOAP operations
  MAX_RECENT_ERRORS: 50 // Maximum errors to keep in memory
} as const;

// Step identifiers (matching existing implementation)
export const STEP_IDS = {
  FRONTEND: 'frontend',
  FIREBASE_FUNCTIONS: 'firebase-functions',
  TEBRA_PROXY: 'tebra-proxy',
  CLOUD_RUN: 'cloud-run',
  TEBRA_API: 'tebra-api',
  DATA_TRANSFORM: 'data-transform',
  DASHBOARD_UPDATE: 'dashboard-update'
} as const;

// Correlation ID format for log filtering
export const CORRELATION_ID = {
  LENGTH: 8,
  PREFIX: 'tebra-',
  FORMAT: /^tebra-[a-z0-9]{8}$/
} as const;

// Environment URLs (with fallbacks matching current implementation)
export const API_ENDPOINTS = {
  FIREBASE_FUNCTIONS_BASE: 'https://us-central1-luknerlumina-firebase.cloudfunctions.net',
  HEALTH_CHECK: '/healthCheck'
} as const;